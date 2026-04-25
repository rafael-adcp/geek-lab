import createMysqlAction from './create-mysql-action.js';

export default createMysqlAction({
  command: 'mysql',
  describe: 'execute a mysql query',
  argName: 'query',
  buildQuery: (value) => value,
});
