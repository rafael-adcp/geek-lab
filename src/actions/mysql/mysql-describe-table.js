module.exports = ({ mysql }) => ({
  command: 'mysql-describe-table',
  describe: 'describe a mysql table',
  builder: (yargs) => yargs
    .example('$0 mysql-describe-table --table blah"')
    .option('table', { describe: 'table to describe', demanOption: true, type: 'string' })
    .demandOption('table', 'Please provide parameter --table'),
  handler: async (argv) => {
    const query = `describe ${argv.table}`;
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
