export default ({ config }) => ({
  command: 'change-env',
  describe: 'swap cli between environments',
  builder: (yargs) => yargs
    .example('$0 change-env --env prod', 'move cli to uses production config')
    .example('$0 change-env --env my-awesome-project', 'move cli to uses my-awesome-project config')
    .option('env', { describe: 'environment', type: 'string' })
    .demandOption('env', 'Please provide parameter --env'),
  handler: (argv) => {
    const configFileContent = config.read();
    const environment = argv.env;

    if (!configFileContent[environment]) {
      throw new Error('Environment dont exist on cli configuration');
    }

    configFileContent.env = environment;
    configFileContent.token = null;
    configFileContent.tokenExpires = null;

    config.write(configFileContent);

    console.log(`Successfully moved cli to use "${environment}"`);
  },
});
