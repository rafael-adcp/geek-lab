exports.command = 'sample';
exports.describe = 'sample of an action description';

exports.builder = (yargs) => yargs
.example('$0 sample', 'not using params')
.example('$0 sample --param1 batman --param2 10 --param3 true', 'using params')
  .option('param1', {
    type: 'string'
  })
  .option('param2', {
    type: 'number'
  })
  .option('param3', {
    choices: ['option1', 'option2'],
    type: 'string'
  })
  .option('param4', {
    type: 'boolean'
  });

exports.handler = (argv) => {
    console.log('Inside action sample')
    console.log(argv);
};