exports.command = 'config';
exports.describe = 'show and perform changes on config file';

exports.builder = (yargs) => yargs
  .example('$0 config', 'shows cli tool config file')
  .example('$0 config --env prod --key apiUrl --value blah', 'sets apiUrl on env prod to be blah')
  .option('env', { describe: 'environment', type: 'string' })
  .option('key', { describe: 'key that will receive the value', type: 'string' })
  .option('value', { describe: 'value...', type: 'string' });

const UTILS = require('../../lib/utils');

exports.handler = (argv) => {
  const configFileContent = UTILS.readConfig();
  if (argv.env && argv.key && argv.value) {
    if (!configFileContent[argv.env]) {
      configFileContent[argv.env] = {};
    }
    configFileContent[argv.env][argv.key] = argv.value;
    UTILS.writeInternalCliFile(
      'config_geek-lab.json',
      configFileContent
    );
  } else { // by default config is shown
    console.log(`Configuration file can be found at "${UTILS.getUserDirectory()}"`);
    const output = JSON.stringify(
      configFileContent, null, ' '
    );
    console.log(output);
    return output;
  }
};