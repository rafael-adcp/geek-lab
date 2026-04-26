import { isTokenValid, computeTokenExpires, fetchToken } from '../utils/auth/index.js';

export default ({ http, config, clock }) => ({
  command: 'auth',
  describe: 'performs api authentication',
  builder: (yargs) => yargs.example('$0'),
  handler: async () => {
    const appConfig = config.read();
    const now = clock.now();

    if (!isTokenValid({ now, token: appConfig.token, tokenExpires: appConfig.tokenExpires })) {
      appConfig.token = await fetchToken({ http, config });
      appConfig.tokenExpires = computeTokenExpires({
        now,
        expiresInMinutes: config.resolveValue('apiAuthenticationExpiresInMinutes'),
      });
      config.write(appConfig);
    }

    console.log(`auth worked, token: ${appConfig.token}`);
  },
});
