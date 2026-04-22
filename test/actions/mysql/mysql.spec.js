const assert = require('node:assert/strict');
const sinon = require('sinon');
const yargs = require('yargs');

const cases = [
  {
    factory: require('../../../src/actions/mysql/mysql'),
    command: 'mysql',
    argName: 'query',
    value: 'select * from heroes where is_superhero = true',
  },
  {
    factory: require('../../../src/actions/mysql/mysql-describe-table'),
    command: 'mysql-describe-table',
    argName: 'table',
    value: 'humans',
  },
  {
    factory: require('../../../src/actions/mysql/mysql-find-column'),
    command: 'mysql-find-column',
    argName: 'column',
    value: 'is_superhero',
  },
  {
    factory: require('../../../src/actions/mysql/mysql-find-table'),
    command: 'mysql-find-table',
    argName: 'table',
    value: 'sidekicks',
  },
];

describe('#actions/mysql', () => {
  cases.forEach(({ factory, command, argName, value }) => {
    describe(`#${command}`, () => {
      it('passes a query containing the user-provided value to mysql.query', async () => {
        const query = sinon.stub().resolves({ rows: [] });
        const action = factory({ mysql: { query } });
        action.builder(yargs);

        await action.handler({ [argName]: value });

        assert.strictEqual(action.command, command);
        assert.strictEqual(query.calledOnce, true);
        assert.ok(
          query.getCall(0).args[0].includes(value),
          `expected query to include "${value}", got "${query.getCall(0).args[0]}"`
        );
      });

      it('wraps query failures with the original cause and the user input', async () => {
        const cause = 'monkeys forced it to fail';
        const query = sinon.stub().rejects(new Error(cause));
        const action = factory({ mysql: { query } });

        await assert.rejects(
          action.handler({ [argName]: value }),
          (err) => err.message.includes('Failed to execute query')
            && err.message.includes(cause)
            && err.message.includes(value)
        );
      });
    });
  });
});
