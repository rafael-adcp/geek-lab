import createMysqlAction from '../../utils/mysql/create-action.js';

export default createMysqlAction({
  command: 'mysql-find-table',
  describe: 'search mysql tables by name',
  argName: 'table',
  buildQuery: (table) => `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%${table}%'`,
});
