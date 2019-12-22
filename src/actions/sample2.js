exports.command = 'another-sample';
exports.describe = 'another sample desc';

exports.builder = (yargs) => yargs
  .positional('param1', {
    type: 'string',
  })
  .option('param4', {
    type: 'boolean',
  });

exports.handler = (argv) => {
  console.log('Inside action another sample');
  console.log(argv);
};