import {
  isTokenValid,
  parseAuthResponse,
  computeTokenExpires,
  resolveAuthBody,
} from '../utils/auth/index.js';

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
          data: resolveAuthBody(config),
        });
      } catch (e) {
        throw new Error(`Failed to execute api call: ${e.message}`, { cause: e });
      }

      const tokenField = config.resolveValue('apiTokenResponseField');
      const parsed = parseAuthResponse(apiResponse, tokenField);
      if (!parsed.ok) {
        throw new Error(
          `Something wrong happend on authentication. Got payload: ${JSON.stringify(apiResponse)}`
        );
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
