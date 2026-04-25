export default ({ paths, actions }) => ({
  command: 'default-actions',
  describe: 'show current default-actions for cli',
  builder: (yargs) => yargs.example('$0 default-actions'),
  handler: () => {
    const msg = `Default actions are located at:` +
      `\n\n${actions.list([paths.defaultActions()]).join('\n')}`;

    console.log(msg);
    return msg;
  },
});
