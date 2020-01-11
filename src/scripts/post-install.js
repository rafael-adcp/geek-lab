const fs = require('fs');
const UTILS = require('../lib/utils');
console.log('Executing post install script');

const localFolderPath = UTILS.getUserDirectory();

if (!fs.existsSync(localFolderPath)) {
  console.log(`Creating local folder for geek-lab at ${localFolderPath}`);
  fs.mkdirSync(localFolderPath);
}

[
  {
    description: 'local config',
    path: `${localFolderPath}/config_geek-lab.json`,
    data: {
      'env': 'dev',
      'debugMode': false,
      'collectMetrics': true,
      'token': null,
      'tokenExpires': null,
      'customActionsPath': [],
      'dev': {
        'apiUrl': 'http://www.my_website.com',
        'apiAuthenticationExpiresInMinutes': 120,
        'apiAuthenticationEndpoint': '/auth',
        'apiTokenResponseField': 'bbb',
        'apiAuthenticationJson': {
          auth: {
            username: 'aaa',
            password: 'bbb',
          },
        },
      },
    },
  },
  {
    description: 'metrics file',
    path: `${localFolderPath}/metrics_geek-lab.json`,
    data: {
      totalUsage: {},
      dailyUsage: {},
    },
  },
].forEach((item) => {

  if (!fs.existsSync(item.path)) {

    console.log(`Creating ${item.description} for geek-lab at ${item.path}`);
    fs.writeFileSync(
      item.path,
      JSON.stringify(item.data, null, 2)
    );
  }
});