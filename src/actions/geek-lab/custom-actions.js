exports.command = 'custom-actions';
exports.describe = 'show current custom-actions for cli';

exports.builder = (yargs) => yargs
  .example('$0 custom-actions');

const UTILS = require('../../lib/utils');

exports.handler = () => {
  const msg = `Custom actions are located at:` +
    `\n\n${UTILS.getActionsFromPath(
      UTILS.readConfig().customActionsPath
    ).join('\n')}`;

  console.log(msg);
  return msg;

};