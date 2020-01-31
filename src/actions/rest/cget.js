exports.command = 'cget';
exports.describe = 'performs a GET request';
exports.restAction = 'GET';

exports.builder = (yargs) => yargs
  .option('url', { describe: 'endpoint to make a get request', demanOption: true, type: 'string' })
  .demandOption('url', 'Please provide parameter --url')
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