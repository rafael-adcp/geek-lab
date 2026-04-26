import assert from 'node:assert/strict';
import { createCliEnv, writeMysqlShim } from '../helpers/e2e.js';

describe('#e2e/mysql', () => {
  let env;

  afterEach(() => {
    env?.cleanup();
    env = null;
  });

  function setup(seedRows = []) {
    env = createCliEnv({
      config: {
        env: 'dev',
        dev: {
          mysqlHost: 'localhost.test',
          mysqlUser: 'tester',
          mysqlPassword: 'secret',
        },
      },
    });
    const shim = writeMysqlShim(env.home, {
      rows: seedRows,
      fields: [{ name: 'id' }, { name: 'name' }],
    });
    return { extraEnv: { GEEK_LAB_MYSQL2_MODULE: shim.shimPath }, shim };
  }

  it('mysql forwards the user-provided --query string straight to execute()', async () => {
    const { extraEnv, shim } = setup([{ id: 1, name: 'a' }]);

    const { stdout, status } = await env.run(
      ['mysql', '--query', 'select * from heroes'],
      extraEnv
    );

    assert.strictEqual(status, 0);
    const log = shim.readLog();
    assert.deepStrictEqual(
      log.find((e) => e.event === 'connect').creds,
      { host: 'localhost.test', user: 'tester', password: 'secret' }
    );
    assert.strictEqual(log.find((e) => e.event === 'execute').sql, 'select * from heroes');
    assert.ok(log.some((e) => e.event === 'destroy'));
    assert.deepStrictEqual(JSON.parse(stdout), [{ id: 1, name: 'a' }]);
  });

  it('mysql-describe-table renders "describe <table>" from --table', async () => {
    const { extraEnv, shim } = setup();

    const { status } = await env.run(
      ['mysql-describe-table', '--table', 'humans'],
      extraEnv
    );

    assert.strictEqual(status, 0);
    assert.strictEqual(shim.readLog().find((e) => e.event === 'execute').sql, 'describe humans');
  });

  it('mysql-find-column embeds --column in a LIKE on INFORMATION_SCHEMA.COLUMNS', async () => {
    const { extraEnv, shim } = setup();

    const { status } = await env.run(
      ['mysql-find-column', '--column', 'is_superhero'],
      extraEnv
    );

    assert.strictEqual(status, 0);
    const sql = shim.readLog().find((e) => e.event === 'execute').sql;
    assert.ok(sql.includes('INFORMATION_SCHEMA.COLUMNS'));
    assert.ok(sql.includes(`'%is_superhero%'`));
  });

  it('mysql-find-table embeds --table in a LIKE on INFORMATION_SCHEMA.TABLES', async () => {
    const { extraEnv, shim } = setup();

    const { status } = await env.run(
      ['mysql-find-table', '--table', 'sidekicks'],
      extraEnv
    );

    assert.strictEqual(status, 0);
    const sql = shim.readLog().find((e) => e.event === 'execute').sql;
    assert.ok(sql.includes('INFORMATION_SCHEMA.TABLES'));
    assert.ok(sql.includes(`'%sidekicks%'`));
  });

  it('exits non-zero and surfaces the original cause when execute() rejects', async () => {
    env = createCliEnv({
      config: {
        env: 'dev',
        dev: { mysqlHost: 'h', mysqlUser: 'u', mysqlPassword: 'p' },
      },
    });

    const path = await import('path');
    const fs = await import('fs');
    const shimPath = path.default.join(env.home, 'mysql2-shim.mjs');
    fs.default.writeFileSync(
      shimPath,
      `export default {
  async createConnection() {
    return {
      async execute() { throw new Error('connection refused by db'); },
      async destroy() {},
    };
  },
};
`
    );

    const { status, stdout, stderr } = await env.run(
      ['mysql', '--query', 'select 1'],
      { GEEK_LAB_MYSQL2_MODULE: shimPath }
    );

    assert.notStrictEqual(status, 0);
    const out = stdout + stderr;
    assert.ok(out.includes('Failed to execute query'), `got:\n${out}`);
    assert.ok(out.includes('connection refused by db'), `got:\n${out}`);
  });
});
