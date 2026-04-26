import isEmpty from 'lodash/isEmpty.js';

export function readConfig(fs, configPath) {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    throw new Error(
      `Failed to read file ${configPath} — either it does not exist or it is not valid JSON. ` +
      `Check the file for invalid characters, or reinstall the tool to regenerate it.`,
      { cause: e }
    );
  }
}

export function writeConfig(fs, configPath, data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, '  '));
}

export function resolveValue(config, key) {
  const currentEnv = config.env;
  if (!currentEnv) {
    throw new Error('Invalid env for cli');
  } else if (isEmpty(config[currentEnv])) {
    throw new Error(`Environment ${currentEnv} is not set on config file.`);
  } else if (!config[currentEnv][key]) {
    throw new Error(`Key "${key}" is not set for environment "${currentEnv}"`);
  }
  return config[currentEnv][key];
}

