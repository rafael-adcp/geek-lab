import assert from 'node:assert/strict';
import { createCliEnv, writeMysqlShim } from '../helpers/e2e.js';

const RECORDED_CREDS = { host: 'localhost.test', user: 'tester', password: 'secret' };

function setupRecordingEnv({ seedRows = [] } = {}) {
  const env = createCliEnv({
    config: {
      env: 'dev',
      dev: {
        mysqlHost: RECORDED_CREDS.host,
        mysqlUser: RECORDED_CREDS.user,
        mysqlPassword: RECORDED_CREDS.password,
      },
    },
  });
  const shim = writeMysqlShim(env.home, {
    rows: seedRows,
    fields: [{ name: 'id' }, { name: 'name' }],
  });
  return { env, shim, extraEnv: { GEEK_LAB_MYSQL2_MODULE: shim.shimPath } };
}

describe('#e2e/mysql — mysql --query', () => {
  let env;
  let shim;
  let runResult;

  before(async () => {
    const s = setupRecordingEnv({ seedRows: [{ id: 1, name: 'a' }] });
    env = s.env;
    shim = s.shim;
    runResult = await env.run(['mysql', '--query', 'select * from heroes'], s.extraEnv);
  });

  after(() => env.cleanup());

  it('exits zero', () => {
    assert.strictEqual(runResult.status, 0);
  });

  it('opens a connection with the configured creds', () => {
    const connect = shim.readLog().find((e) => e.event === 'connect');
    assert.deepStrictEqual(connect.creds, RECORDED_CREDS);
  });

  it('forwards the user-provided --query verbatim to execute()', () => {
    const execute = shim.readLog().find((e) => e.event === 'execute');
    assert.strictEqual(execute.sql, 'select * from heroes');
  });

  it('destroys the connection before exit', () => {
    assert.ok(shim.readLog().some((e) => e.event === 'destroy'));
  });

  it('prints the rows returned by execute() as JSON on stdout', () => {
    assert.deepStrictEqual(JSON.parse(runResult.stdout), [{ id: 1, name: 'a' }]);
  });
});

describe('#e2e/mysql — mysql-describe-table --table', () => {
  let env;
  let shim;
  let runResult;

  before(async () => {
    const s = setupRecordingEnv();
    env = s.env;
    shim = s.shim;
    runResult = await env.run(['mysql-describe-table', '--table', 'humans'], s.extraEnv);
  });

  after(() => env.cleanup());

  it('exits zero', () => {
    assert.strictEqual(runResult.status, 0);
  });

  it('runs "describe <table>"', () => {
    const execute = shim.readLog().find((e) => e.event === 'execute');
    assert.strictEqual(execute.sql, 'describe humans');
  });
});

describe('#e2e/mysql — mysql-find-column --column', () => {
  let env;
  let shim;
  let runResult;

  before(async () => {
    const s = setupRecordingEnv();
    env = s.env;
    shim = s.shim;
    runResult = await env.run(['mysql-find-column', '--column', 'is_superhero'], s.extraEnv);
  });

  after(() => env.cleanup());

  it('exits zero', () => {
    assert.strictEqual(runResult.status, 0);
  });

  it('queries INFORMATION_SCHEMA.COLUMNS', () => {
    const sql = shim.readLog().find((e) => e.event === 'execute').sql;
    assert.ok(sql.includes('INFORMATION_SCHEMA.COLUMNS'), `got: ${sql}`);
  });

  it('LIKEs the user-provided column name', () => {
    const sql = shim.readLog().find((e) => e.event === 'execute').sql;
    assert.ok(sql.includes(`'%is_superhero%'`), `got: ${sql}`);
  });
});

describe('#e2e/mysql — mysql-find-table --table', () => {
  let env;
  let shim;
  let runResult;

  before(async () => {
    const s = setupRecordingEnv();
    env = s.env;
    shim = s.shim;
    runResult = await env.run(['mysql-find-table', '--table', 'sidekicks'], s.extraEnv);
  });

  after(() => env.cleanup());

  it('exits zero', () => {
    assert.strictEqual(runResult.status, 0);
  });

  it('queries INFORMATION_SCHEMA.TABLES', () => {
    const sql = shim.readLog().find((e) => e.event === 'execute').sql;
    assert.ok(sql.includes('INFORMATION_SCHEMA.TABLES'), `got: ${sql}`);
  });

  it('LIKEs the user-provided table name', () => {
    const sql = shim.readLog().find((e) => e.event === 'execute').sql;
    assert.ok(sql.includes(`'%sidekicks%'`), `got: ${sql}`);
  });
});

describe('#e2e/mysql — execute() rejects', () => {
  let env;
  let runResult;

  before(async () => {
    env = createCliEnv({
      config: {
        env: 'dev',
        dev: { mysqlHost: 'h', mysqlUser: 'u', mysqlPassword: 'p' },
      },
    });
    const shim = writeMysqlShim(env.home, { rejectsWith: 'connection refused by db' });
    runResult = await env.run(['mysql', '--query', 'select 1'], { GEEK_LAB_MYSQL2_MODULE: shim.shimPath });
  });

  after(() => env.cleanup());

  it('exits non-zero', () => {
    assert.notStrictEqual(runResult.status, 0);
  });

  it('mentions "Failed to execute query"', () => {
    const out = runResult.stdout + runResult.stderr;
    assert.ok(out.includes('Failed to execute query'), `got:\n${out}`);
  });

  it('surfaces the original cause message', () => {
    const out = runResult.stdout + runResult.stderr;
    assert.ok(out.includes('connection refused by db'), `got:\n${out}`);
  });
});
