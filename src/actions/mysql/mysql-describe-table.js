import createMysqlAction from '../../utils/mysql/create-action.js';

export default createMysqlAction({
  command: 'mysql-describe-table',
  describe: 'describe a mysql table',
  argName: 'table',
  buildQuery: (table) => `describe ${table}`,
});
