export default function createRestAction({ command, method, describe, hasBody }) {
  return ({ http }) => {
    const builder = (yargs) => {
      let y = yargs.option('endpoint', {
        describe: `endpoint to make a ${method} request`,
        type: 'string',
      }).demandOption('endpoint', 'Please provide parameter --endpoint');

      if (hasBody) {
        y = y.option('json', { describe: 'json data to send', type: 'string' })
          .demandOption('json', 'Please provide parameter --json')
          .example(`$0 ${command} --endpoint blah --json @foo.json`);
      } else {
        y = y.example(`$0 ${command} --endpoint blah`).example(`$0 ${command} blah`);
      }
      return y;
    };

    const handler = async (argv) => {
      const params = { method, endpoint: argv.endpoint };
      if (hasBody) params.data = argv.json;

      // eslint-disable-next-line no-console -- handler output channel, not util-level
      console.log(JSON.stringify(await http.request(params), null, 2));
    };

    return { command, describe, builder, handler };
  };
}
