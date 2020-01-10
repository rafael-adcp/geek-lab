exports.command = 'auth';
exports.describe = 'performs api authentication';

exports.builder = (yargs) => yargs
  .example('$0');

const moment = require('moment');
const isEmpty = require('lodash/isEmpty');

const UTILS = require('../lib/utils');

exports.handler = async () => {
  const appConfig = UTILS.readConfig();
  //if theres no token set or if the token is expired
  if (!appConfig.token || moment().isSameOrAfter(UTILS.readConfig().tokenExpires)) {
    let apiResponse;
    try {
      apiResponse = await UTILS.performRequest({
        method: 'POST',
        endpoint: UTILS.getConfigValue('apiAuthenticationEndpoint'),
        data: JSON.stringify(UTILS.getConfigValue('apiAuthenticationJson')),
      });
    } catch (e) {
      console.log(e.toString());
      throw new Error('Failed to execute api call');
    }
    if (!apiResponse.response || apiResponse.response.status !== 'OK' || isEmpty(apiResponse.response[UTILS.getConfigValue('apiTokenResponseField')])) {
      console.log(apiResponse);
      throw new Error('Something wrong happend on authentication');
    }
    appConfig.token = apiResponse.response[UTILS.getConfigValue('apiTokenResponseField')];

    appConfig.tokenExpires = moment().add(UTILS.getConfigValue('apiAuthenticationExpiresInMinutes'), 'minutes');
    UTILS.writeInternalCliFile(
      'config_geek-lab.json',
      appConfig
    );
  }
  const response = `auth worked, token: ${appConfig.token}`;
  console.log(response);
  return response;
};