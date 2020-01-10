exports.command = 'cget';
exports.describe = 'performs a GET request';
exports.restAction = 'GET';

exports.builder = (yargs) => yargs
  .option('url', { describe: 'endpoint to make a get request', demanOption: true, type: 'string' })
  .example('$0 cget --endpoint blah')
  .example('$0 cget blah');

const isEmpty = require('lodash/isEmpty');

const UTILS = require('../../lib/utils');

exports.handler = async (argv) => {
  if (!argv || isEmpty(argv.endpoint)) {
    throw new Error('Parameter --endpoint cant be empty');
  }
  console.log(
    await UTILS.performRequest({
      method: 'GET',
      endpoint: argv.endpoint,
    })
  );
};