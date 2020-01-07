exports.command = 'cdelete';
exports.describe = 'performs a DELETE request';

exports.builder = (yargs) => yargs
  .option('url', { describe: 'endpoint to make a DELETE request', demanOption: true, type: 'string' })
  .example('$0 cdelete --endpoint blah')
  .example('$0 cdelete blah');

const isEmpty = require('lodash/isEmpty');
const axios = require('axios');
const startsWith = require('lodash/startsWith');

const {
  getConfigValue,
} = require('../../lib/utils');

exports.handler = async (argv) => {
  if (!argv || isEmpty(argv.endpoint)) {
    throw new Error('Parameter --endpoint cant be empty');
  }

  //preventing double "/""
  const endpoint = startsWith(argv.endpoint, '/') ? argv.endpoint : `/${argv.endpoint}`;

  const request = await axios({
    method: 'DELETE',
    url: getConfigValue('apiUrl') + endpoint,
  });

  const data = await request.data;

  console.log(
    JSON.stringify(
      data, null, 2
    )
  );
};