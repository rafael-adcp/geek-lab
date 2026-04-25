export default ({ mysql }) => ({
  command: 'mysql-find-table',
  describe: 'describe a mysql table',
  builder: (yargs) => yargs
    .example('$0 mysql-find-table --table blah"')
    .option('table', { describe: 'table to search', demanOption: true, type: 'string' })
    .demandOption('table', 'Please provide parameter --table'),
  handler: async (argv) => {
    try {
      const query = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%${argv.table}%'`;
      const mysqlResult = await mysql.query(query);
      console.log(JSON.stringify(mysqlResult.rows, null, 2));
      return mysqlResult;
    } catch (e) {
      console.log(e.toString());
      throw new Error(`Failed to execute query: "${argv.table}" due to ` + e.toString(), { cause: e });
    }
  },
});
