exports.command = 'cput';
exports.describe = 'performs a PUT request';
exports.restAction = 'PUT';

exports.builder = (yargs) => yargs
  .option('endpoint', { describe: 'endpoint to make a PUT request', demanOption: true, type: 'string' })
  .option('json', { describe: 'json data to send', demanOption: true, type: 'string' })
  .demandOption('endpoint', 'Please provide parameter --endpoint')
  .demandOption('json', 'Please provide parameter --json')
  .example('$0 cput --endpoint blah --json @foo.json');

const UTILS = require('../../lib/utils');

exports.handler = async (argv) => {
  console.log(
    JSON.stringify(
      await UTILS.performRequest({
        method: 'PUT',
        endpoint: argv.endpoint,
        data: argv.json,
      })
      , null, 2)

  );
};