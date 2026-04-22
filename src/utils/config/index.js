const _ = require('lodash');

function readConfig(fs, configPath) {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.log('Something went wrong, either it couldnt find the file, or its failing to parse it as json');
    console.log(`Could not find folder or file ${configPath}`);
    console.log(`Debug instructions:
      - check file for invalid characters
      - install the tool again and it will generate everything you need if missing something`);
    console.log(e);
    throw new Error('Failed to read file', { cause: e });
  }
}

function resolveValue(config, key) {
  const currentEnv = config.env;
  if (_.isEmpty(currentEnv)) {
    throw new Error('Invalid env for cli');
  } else if (_.isEmpty(config[currentEnv])) {
    throw new Error(`Environment ${currentEnv} is not set on config file.`);
  } else if (!config[currentEnv][key] && _.isEmpty(config[currentEnv][key])) {
    throw new Error(`Key "${key}" is not set for environment "${currentEnv}"`);
  }
  return config[currentEnv][key];
}

module.exports = { readConfig, resolveValue };
