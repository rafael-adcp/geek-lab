exports.command = 'cput';
exports.describe = 'performs a PUT request';

exports.builder = (yargs) => yargs
  .option('url', { describe: 'endpoint to make a PUT request', demanOption: true, type: 'string' })
  .option('jsonFile', { describe: 'json data to send', demanOption: true, type: 'string' })
  .example('$0 cput --endpoint blah --jsonFile @foo.json');

const isEmpty = require('lodash/isEmpty');
const axios = require('axios');
const startsWith = require('lodash/startsWith');
const fs = require('fs');

const {
  getConfigValue,
} = require('../../lib/utils');

exports.handler = async (argv) => {
  if (!argv || isEmpty(argv.endpoint) || isEmpty(argv.jsonFile)) {
    throw new Error('Parameter --endpoint and --jsonFile cant be empty');
  }

  //preventing double "/""
  const endpoint = startsWith(argv.endpoint, '/') ? argv.endpoint : `/${argv.endpoint}`;

  const jsonData = startsWith(argv.jsonFile, '@') ? fs.readFileSync(argv.jsonFile.replace('@', ''), 'utf8') : argv.jsonFile;

  //ensuring we have valid json DATA
  JSON.parse(jsonData);

  const request = await axios({
    method: 'PUT',
    url: getConfigValue('apiUrl') + endpoint,
    data: jsonData,
  });

  const data = await request.data;

  console.log(
    JSON.stringify(
      data, null, 2
    )
  );
};