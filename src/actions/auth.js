exports.command = 'auth';
exports.describe = 'performs api authentication';

exports.builder = (yargs) => yargs
  .example('$0');

const moment = require('moment');
const isEmpty = require('lodash/isEmpty');

const {
  performRequest,
  getConfigValue,
  readConfig,
  writeInternalCliFile,
} = require('../lib/utils');

exports.handler = async () => {
  const appConfig = readConfig();

  //if theres no token set or if the token is expired
  if (!appConfig.token || moment().isSameOrAfter(readConfig().tokenExpires)) {
    let apiResponse;
    try {
      apiResponse = await performRequest({
        method: 'POST',
        endpoint: getConfigValue('apiAuthenticationEndpoint'),
        data: JSON.stringify(getConfigValue('apiAuthenticationJson')),
      });
    } catch (e) {
      console.log(e.toString());
      throw new Error('Failed to execute api call');
    }

    if (!apiResponse.response || apiResponse.response.status !== 'OK' || isEmpty(apiResponse.response[getConfigValue('apiTokenResponseField')])) {
      console.log(apiResponse);
      throw new Error('Something wrong happend on authentication');
    }

    appConfig.token = apiResponse.response[getConfigValue('apiTokenResponseField')];

    appConfig.tokenExpires = moment().add(getConfigValue('apiAuthenticationExpiresInMinutes', 'minutes'));
    writeInternalCliFile(
      'config_geek-lab.json',
      appConfig
    );
  }
  console.log(`auth worked, token: ${appConfig.token}`);
};