exports.command = 'metrics';
exports.describe = 'show current metrics for cli';

exports.builder = (yargs) => yargs
  .option('env', { describe: 'environment', type: 'string' })
  .example('$0 metrics', 'print the metrics as they are from metrics file')
  .example('$0 metrics --pretty', 'outputs an amazing graph to show the metrics');

const handlebars = require('handlebars');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const path = require('path');

const UTILS = require('../../lib/utils');
const find = require('lodash/find');
const isEqual = require('lodash/isEqual');

exports.handler = (argv) => {
  const metricsFileContent = UTILS.readMetricsFile();
  let msg;
  if (argv.pretty) {

    // set up handlebars template
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../handlebars/metrics_template.hb')
    ).toString();

    // compile the template
    const template = handlebars.compile(source);

    const handlebarData = {
      generatedOverallGraph: [],
      generatedeEachActionlGraph: [],
    };

    const totalUsage = [];
    const availableActions = [];

    for (const item in metricsFileContent.totalUsage) {
      availableActions.push(item);
      totalUsage.push(
        [
          item, metricsFileContent.totalUsage[item],
        ]
      );
    }

    handlebarData.generatedOverallGraph.push({
      data: JSON.stringify(totalUsage),
      id: 'graphic_' + uuidv1().replace(/-/g, '_'),
      name: 'Total Usage',
      type: 'donut',
    });

    const availableDays = [];

    for (const day in metricsFileContent.dailyUsage) {
      availableDays.push(day);
    }

    const actionUsagePerDay = [];
    for (const action of availableActions) {
      const currentAction = [];
      currentAction.push(action);

      for (const day of availableDays) {

        const usageAmount = metricsFileContent.dailyUsage[day][action];

        if (usageAmount === undefined) {
          currentAction.push(0);
        } else {
          currentAction.push(usageAmount);
        }
      }
      actionUsagePerDay.push(currentAction);
    }

    handlebarData.generatedOverallGraph.push({
      data: JSON.stringify(actionUsagePerDay),
      id: 'graphic_' + uuidv1().replace(/-/g, '_'),
      name: 'Usage evolution per day',
      type: 'line',
      categories: JSON.stringify(availableDays),
    });

    let i = 0;
    for (const action of availableActions) {
      let openNewRow = false;
      let closeRow = false;

      if (i === 0) {
        openNewRow = true;
      } else if ((i % 2) === 0) {
        closeRow = true;
      }
      const currentActionMetrics = find(actionUsagePerDay, (o) => {
        return isEqual(o[0], action);
      });

      handlebarData.generatedeEachActionlGraph.push({
        data: JSON.stringify(currentActionMetrics),
        id: 'graphic_each_action' + uuidv1().replace(/-/g, '_'),
        name: action,
        type: 'line',
        categories: JSON.stringify(availableDays),
        openNewRow: openNewRow,
        closeRow: closeRow,
      });

      i++;
      if (i > 2) {
        i = 0;
      }
    }

    // call template as a function, passing in your data as the context
    const parsedString = template(
      handlebarData
    );

    const reportDestination = path.resolve(__dirname, `../../handlebars/awesome_metrics_graph_${uuidv1()}.html`);
    msg = `Html report generated and located at ${reportDestination}`;
    fs.writeFileSync(reportDestination, parsedString);
  } else {
    msg = JSON.stringify(metricsFileContent, null, 2);
  }
  console.log(msg);
  return msg;

};