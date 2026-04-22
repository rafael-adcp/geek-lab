module.exports = ({ mysql }) => ({
  command: 'mysql',
  describe: 'execute a mysql query',
  builder: (yargs) => yargs
    .example('$0 mysql --query "SELECT 1"')
    .option('query', { describe: 'query to execute', demanOption: true, type: 'string' })
    .demandOption('query', 'Please provide parameter --query'),
  handler: async (argv) => {
    try {
      const mysqlResult = await mysql.query(argv.query);
      console.log(JSON.stringify(mysqlResult.rows, null, 2));
      return mysqlResult;
    } catch (e) {
      console.log(e.toString());
      throw new Error(`Failed to execute query: "${argv.query}" due to ` + e.toString(), { cause: e });
    }
  },
});
