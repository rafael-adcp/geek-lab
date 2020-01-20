exports.command = 'cpost';
exports.describe = 'performs a POST request';
exports.restAction = 'POST';

exports.builder = (yargs) => yargs
  .option('url', { describe: 'endpoint to make a POST request', demanOption: true, type: 'string' })
  .option('json', { describe: 'json data to send', demanOption: true, type: 'string' })
  .example('$0 cpost --endpoint blah --json @foo.json');

const isEmpty = require('lodash/isEmpty');

const UTILS = require('../../lib/utils');

exports.handler = async (argv) => {
  if (!argv || isEmpty(argv.endpoint) || isEmpty(argv.json)) {
    throw new Error('Parameter --endpoint and --json cant be empty');
  }

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