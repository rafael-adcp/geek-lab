exports.command = 'cget';
exports.describe = 'performs a GET request';
exports.restAction = 'GET';

exports.builder = (yargs) => yargs
  .option('endpoint', { describe: 'endpoint to make a get request', demanOption: true, type: 'string' })
  .demandOption('endpoint', 'Please provide parameter --endpoint')
  .example('$0 cget --endpoint blah')
  .example('$0 cget blah');

const UTILS = require('../../lib/utils');

exports.handler = async (argv) => {
  console.log(
    JSON.stringify(
      await UTILS.performRequest({
        method: 'GET',
        endpoint: argv.endpoint,
      })
      , null, 2)

  );
};