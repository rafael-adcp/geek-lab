exports.command = 'cdelete';
exports.describe = 'performs a DELETE request';

exports.builder = (yargs) => yargs
  .option('url', { describe: 'endpoint to make a DELETE request', demanOption: true, type: 'string' })
  .example('$0 cdelete --endpoint blah')
  .example('$0 cdelete blah');

const isEmpty = require('lodash/isEmpty');

const {
  performRequest,
} = require('../../lib/utils');

exports.handler = async (argv) => {
  if (!argv || isEmpty(argv.endpoint)) {
    throw new Error('Parameter --endpoint cant be empty');
  }

  console.log(
    await performRequest({
      method: 'DELETE',
      endpoint: argv.endpoint,
    })
  );
};