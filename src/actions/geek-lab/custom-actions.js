export default ({ config, actions }) => ({
  command: 'custom-actions',
  describe: 'show current custom-actions for cli',
  builder: (yargs) => yargs.example('$0 custom-actions'),
  handler: () => {
    console.log(
      `Custom actions are located at:` +
      `\n\n${actions.list(config.read().customActionsPath).join('\n')}`
    );
  },
});
