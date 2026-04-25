import createMysqlAction from './create-mysql-action.js';

export default createMysqlAction({
  command: 'mysql-find-column',
  describe: 'search mysql columns by name',
  argName: 'column',
  buildQuery: (column) =>
    `SELECT TABLE_SCHEMA,TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME LIKE '%${column}%';`,
});
