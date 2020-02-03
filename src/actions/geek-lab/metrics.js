exports.command = 'metrics';
exports.describe = 'show current metrics for cli';

exports.builder = (yargs) => yargs
  .option('env', { describe: 'environment', type: 'string' })
  .example('$0 metrics', 'print the metrics as they are from config file')
  .example('$0 metrics --pretty', 'outputs and amazing graph to show the metrics');

const handlebars = require('handlebars');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const path = require('path');

const UTILS = require('../../lib/utils');

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
      id: 'graphic_' + uuidv1().replace(/\-/g, '_'),
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
      id: 'graphic_' + uuidv1().replace(/\-/g, '_'),
      name: 'Usage evolution per day',
      type: 'line',
      categories: JSON.stringify(availableDays),
    });
    console.log(handlebarData, null, 2);

    // call template as a function, passing in your data as the context
    const parsedString = template(
      handlebarData
    );

    const reportDestination = path.resolve(__dirname, `../../handlebars/awesome_metrics_graph_${uuidv1()}.html`);

    fs.writeFileSync(reportDestination, parsedString);
  } else {
    msg = JSON.stringify(metricsFileContent, null, 2);
  }
  console.log(msg);
  return msg;

};