exports.command = 'default-actions';
exports.describe = 'show current default-actions for cli';

exports.builder = (yargs) => yargs
  .example('$0 default-actions');

const UTILS = require('../../lib/utils');

exports.handler = () => {
  const msg = `Default actions are located at:` +
  `\n\n${UTILS.getActionsFromPath([
    UTILS.getDefaultActionsPath(),
  ]).join('\n')}`;

  console.log(msg);
  return msg;
};