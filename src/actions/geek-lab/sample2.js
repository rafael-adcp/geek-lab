exports.command = 'another-sample';
exports.describe = 'action to force error due to duplicated key';

exports.builder = (yargs) => yargs
  .positional('param1', {
    type: 'string',
  })
  .option('param4', {
    type: 'boolean',
  });

exports.handler = (argv) => {
  console.log('Inside action another sample')
  console.log(argv);
};