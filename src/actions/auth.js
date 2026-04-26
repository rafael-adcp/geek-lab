import isEmpty from 'lodash/isEmpty.js';

export default ({ http, config }) => ({
  command: 'auth',
  describe: 'performs api authentication',
  builder: (yargs) => yargs.example('$0'),
  handler: async () => {
    const appConfig = config.read();
    if (!appConfig.token || new Date() >= new Date(config.read().tokenExpires)) {
      let apiResponse;
      try {
        apiResponse = await http.request({
          method: 'POST',
          endpoint: config.resolveValue('apiAuthenticationEndpoint'),
          data: JSON.parse(config.resolveValue('apiAuthenticationJson')),
        });
      } catch (e) {
        console.log(e.toString());
        throw new Error('Failed to execute api call', { cause: e });
      }
      const tokenField = config.resolveValue('apiTokenResponseField');
      if (!apiResponse.response || apiResponse.response.status !== 'OK' || isEmpty(apiResponse.response[tokenField])) {
        console.log(apiResponse);
        throw new Error('Something wrong happend on authentication');
      }
      appConfig.token = apiResponse.response[tokenField];

      const expiresInMinutes = config.resolveValue('apiAuthenticationExpiresInMinutes');
      appConfig.tokenExpires = new Date(Date.now() + expiresInMinutes * 60000);
      config.write(appConfig);
    }
    console.log(`auth worked, token: ${appConfig.token}`);
  },
});
