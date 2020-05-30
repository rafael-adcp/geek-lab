exports.command = 'mysql-find-column';
exports.describe = 'describe a mysql table';

exports.builder = (yargs) => yargs
  .example('$0 mysql-find-column --column blah"')
  .option('column', { describe: 'column to search', demanOption: true, type: 'string' })
  .demandOption('column', 'Please provide parameter --column');

const UTILS = require('../../lib/utils');

exports.handler = async (argv) => {
  const query = `SELECT TABLE_SCHEMA,TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME LIKE '%${argv.column}%';`;
  try {
    const mysqlResult = await UTILS.performMySQLQuery(query);
    console.log(
      JSON.stringify(mysqlResult.rows, null, 2)
    );
    return mysqlResult;
  } catch (e) {
    console.log(e.toString());
    throw new Error(`Failed to execute query: "${query}" due to `+ e.toString());
  }
};