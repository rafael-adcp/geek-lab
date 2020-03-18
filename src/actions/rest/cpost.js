exports.command = 'cpost';
exports.describe = 'performs a POST request';
exports.restAction = 'POST';

exports.builder = (yargs) => yargs
  .option('endpoint', { describe: 'endpoint to make a POST request', demanOption: true, type: 'string' })
  .option('json', { describe: 'json data to send', demanOption: true, type: 'string' })
  .demandOption('endpoint', 'Please provide parameter --endpoint')
  .demandOption('json', 'Please provide parameter --json')
  .example('$0 cpost --endpoint blah --json @foo.json');

const UTILS = require('../../lib/utils');

exports.handler = async (argv) => {
  console.log(
    JSON.stringify(
      await UTILS.performRequest({
        method: 'POST',
        endpoint: argv.endpoint,
        data: argv.json,
      })
      , null, 2)
  );
};