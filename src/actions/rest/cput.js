exports.command = 'cput';
exports.describe = 'performs a PUT request';

exports.builder = (yargs) => yargs
  .option('url', { describe: 'endpoint to make a PUT request', demanOption: true, type: 'string' })
  .option('json', { describe: 'json data to send', demanOption: true, type: 'string' })
  .example('$0 cput --endpoint blah --json @foo.json');

const isEmpty = require('lodash/isEmpty');

const {
  performRequest,
} = require('../../lib/utils');

exports.handler = async (argv) => {
  if (!argv || isEmpty(argv.endpoint) || isEmpty(argv.json)) {
    throw new Error('Parameter --endpoint and --json cant be empty');
  }

  console.log(
    await performRequest({
      method: 'PUT',
      endpoint: argv.endpoint,
      data: argv.json,
    })
  );
};