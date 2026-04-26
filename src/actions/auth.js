import { isTokenValid, parseAuthResponse, computeTokenExpires } from '../utils/auth/index.js';

export default ({ http, config, clock }) => ({
  command: 'auth',
  describe: 'performs api authentication',
  builder: (yargs) => yargs.example('$0'),
  handler: async () => {
    const appConfig = config.read();
    const now = clock.now();

    if (!isTokenValid({ now, token: appConfig.token, tokenExpires: appConfig.tokenExpires })) {
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
      const parsed = parseAuthResponse(apiResponse, tokenField);
      if (!parsed.ok) {
        console.log(apiResponse);
        throw new Error('Something wrong happend on authentication');
      }

      appConfig.token = parsed.token;
      appConfig.tokenExpires = computeTokenExpires({
        now,
        expiresInMinutes: config.resolveValue('apiAuthenticationExpiresInMinutes'),
      });
      config.write(appConfig);
    }

    console.log(`auth worked, token: ${appConfig.token}`);
  },
});
