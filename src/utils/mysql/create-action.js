export default function createMysqlAction({ command, describe, argName, buildQuery }) {
  return ({ mysql }) => ({
    command,
    describe,
    builder: (yargs) => yargs
      .example(`$0 ${command} --${argName} <value>`)
      .option(argName, { describe: `${argName} for ${command}`, type: 'string' })
      .demandOption(argName, `Please provide parameter --${argName}`),
    handler: async (argv) => {
      const query = buildQuery(argv[argName]);
      try {
        const mysqlResult = await mysql.query(query);
        console.log(JSON.stringify(mysqlResult.rows, null, 2));
        return mysqlResult;
      } catch (e) {
        console.log(e.toString());
        throw new Error(`Failed to execute query: "${query}" due to ` + e.toString(), { cause: e });
      }
    },
  });
}
