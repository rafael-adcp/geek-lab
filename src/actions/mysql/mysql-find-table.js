exports.command = 'mysql-find-table';
exports.describe = 'describe a mysql table';

exports.builder = (yargs) => yargs
  .example('$0 mysql-find-table --table blah"')
  .option('table', { describe: 'table to search', demanOption: true, type: 'string' })
  .demandOption('table', 'Please provide parameter --table');

const UTILS = require('../../lib/utils');

exports.handler = async (argv) => {
  try {

    const query = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%${argv.table}%'`;
    const mysqlResult = await UTILS.performMySQLQuery(query);
    console.log(
      JSON.stringify(mysqlResult.rows, null, 2)
    );
    return mysqlResult;
  } catch (e) {
    console.log(e.toString());
    throw new Error(`Failed to execute query: "${argv.table}" due to `+ e.toString());
  }
};