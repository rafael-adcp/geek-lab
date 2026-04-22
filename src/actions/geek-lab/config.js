module.exports = ({ config, paths }) => ({
  command: 'config',
  describe: 'show and perform changes on config file',
  builder: (yargs) => yargs
    .example('$0 config', 'shows cli tool config file')
    .example('$0 config --env prod --key apiUrl --value blah', 'sets apiUrl on env prod to be blah')
    .option('env', { describe: 'environment', type: 'string' })
    .option('key', { describe: 'key that will receive the value', type: 'string' })
    .option('value', { describe: 'value...', type: 'string' }),
  handler: (argv) => {
    const configFileContent = config.read();
    if (argv.env && argv.key && argv.value) {
      if (!configFileContent[argv.env]) {
        configFileContent[argv.env] = {};
      }
      configFileContent[argv.env][argv.key] = argv.value;
      config.write(configFileContent);
    } else {
      console.log(`Configuration file can be found at "${paths.userDirectory()}"`);
      const output = JSON.stringify(configFileContent, null, ' ');
      console.log(output);
      return output;
    }
  },
});
