module.exports = ({ http }) => ({
  command: 'cdelete',
  describe: 'performs a DELETE request',
  builder: (yargs) => yargs
    .option('endpoint', { describe: 'endpoint to make a DELETE request', demanOption: true, type: 'string' })
    .demandOption('endpoint', 'Please provide parameter --endpoint')
    .example('$0 cdelete --endpoint blah')
    .example('$0 cdelete blah'),
  handler: async (argv) => {
    console.log(
      JSON.stringify(
        await http.request({
          method: 'DELETE',
          endpoint: argv.endpoint,
        })
        , null, 2)
    );
  },
});
