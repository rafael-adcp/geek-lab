exports.command = 'change-env';
exports.describe = 'swap cli between environments';

exports.builder = (yargs) => yargs
  .example('$0 change-env --env prod', 'move cli to uses production config')
  .example('$0 change-env --env my-awesome-project', 'move cli to uses my-awesome-project config')
  .option('env', { describe: 'environment', type: 'string' });

const {
  readConfig,
  writeInternalCliFile,
} = require('../../lib/utils');

const isEmpty = require('lodash/isEmpty');

exports.handler = (argv) => {
  const configFileContent = readConfig();
  if (isEmpty(argv.env)) {
    throw new Error('Parameter env cant be empty');
  }
  const environment = argv.env;

  if (!configFileContent[environment]) {
    throw new Error('Environment dont exist on cli configuration');
  }

  configFileContent.env = environment;
  configFileContent.token = null;
  configFileContent.tokenExpires = null;

  writeInternalCliFile(
    'config_geek-lab.json',
    configFileContent
  );

  console.log(`Successfully moved cli to use "${environment}"`);
};