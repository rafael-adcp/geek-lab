import handlebars from 'handlebars';
import { v1 as uuidv1 } from 'uuid';
import path from 'path';

import { renderReport } from '../../utils/metrics/report.js';

const genId = (prefix) => `${prefix}_${uuidv1().replace(/-/g, '_')}`;

export default ({ metrics, paths, fs }) => ({
  command: 'metrics',
  describe: 'show current metrics for cli',
  builder: (yargs) => yargs
    .option('pretty', { describe: 'whether or not to generate a html report', type: 'boolean' })
    .example('$0 metrics', 'print the metrics as they are from metrics file')
    .example('$0 metrics --pretty', 'outputs an amazing graph to show the metrics'),
  handler: (argv) => {
    const store = metrics.read();
    if (!argv.pretty) {
      console.log(JSON.stringify(store, null, 2));
      return;
    }

    const html = renderReport({
      fs, handlebars, templatePath: paths.metricsTemplate(), store, genId,
    });
    const dest = path.join(paths.userDirectory(), `awesome_metrics_graph_${uuidv1()}.html`);
    fs.writeFileSync(dest, html);
    console.log(`Html report generated and located at ${dest}`);
  },
});
