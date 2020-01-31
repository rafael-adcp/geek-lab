exports.command = 'cdelete';
exports.describe = 'performs a DELETE request';
exports.restAction = 'DELETE';

exports.builder = (yargs) => yargs
  .option('url', { describe: 'endpoint to make a DELETE request', demanOption: true, type: 'string' })
  .demandOption('url', 'Please provide parameter --url')
  .example('$0 cdelete --endpoint blah')
  .example('$0 cdelete blah');

const UTILS = require('../../lib/utils');

exports.handler = async (argv) => {
  console.log(
    JSON.stringify(
      await UTILS.performRequest({
        method: 'DELETE',
        endpoint: argv.endpoint,
      })
      , null, 2)

  );
};