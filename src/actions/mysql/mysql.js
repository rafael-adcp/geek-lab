exports.command = 'mysql';
exports.describe = 'execute a mysql query';

exports.builder = (yargs) => yargs
  .example('$0 mysql --query "SELECT 1"')
  .option('query', { describe: 'query to execute', demanOption: true, type: 'string' })
  .demandOption('query', 'Please provide parameter --query');

const UTILS = require('../../lib/utils');

exports.handler = async (argv) => {
  try {
    const mysqlResult = await UTILS.performMySQLQuery(argv.query);
    console.log(
      JSON.stringify(mysqlResult.rows, null, 2)
    );
    return mysqlResult;
  } catch (e) {
    console.log(e.toString());
    throw new Error(`Failed to execute query: "${argv.query}" due to `+  e.toString());
  }
};