const assert = require('node:assert/strict');
const { createMysqlClient } = require('../../src/utils/mysql');

describe('#utils/mysql/query', () => {
  it('opens a connection with the resolved creds, executes the query, returns rows + fields, and destroys the connection', async () => {
    const calls = [];
    const fakeConnection = {
      execute: async (sql) => {
        calls.push(['execute', sql]);
        return [
          [{ id: 1, name: 'a' }, { id: 2, name: 'b' }],
          [{ name: 'id' }, { name: 'name' }],
        ];
      },
      destroy: async () => { calls.push(['destroy']); },
    };
    const mysql2 = {
      createConnection: async (creds) => { calls.push(['connect', creds]); return fakeConnection; },
    };

    const client = createMysqlClient({
      mysql2,
      getCreds: () => ({ host: 'h', user: 'u', password: 'p' }),
    });

    const result = await client.query('SELECT 1');

    assert.deepStrictEqual(result.rows, [{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
    assert.deepStrictEqual(result.fields, [{ name: 'id' }, { name: 'name' }]);
    assert.deepStrictEqual(calls, [
      ['connect', { host: 'h', user: 'u', password: 'p' }],
      ['execute', 'SELECT 1'],
      ['destroy'],
    ]);
  });
});
