const assert = require('node:assert/strict');
const { createCliEnv } = require('../helpers/e2e');

describe('#e2e/config', () => {
  let env;

  afterEach(() => {
    env?.cleanup();
    env = null;
  });

  it('prints the current config file contents and its location', async () => {
    env = createCliEnv({ config: { env: 'printme' } });

    const { stdout, status } = await env.run(['config']);

    assert.strictEqual(status, 0);
    assert.ok(stdout.includes('Configuration file can be found at'));
    assert.ok(stdout.includes(env.geekDir));
    assert.ok(stdout.includes('"env": "printme"'));
  });

  it('sets a value on an existing environment', async () => {
    env = createCliEnv({
      config: { dev: { apiUrl: 'http://old' } },
    });

    const { status } = await env.run([
      'config', '--env', 'dev', '--key', 'apiUrl', '--value', 'http://new',
    ]);

    assert.strictEqual(status, 0);
    assert.strictEqual(env.readConfig().dev.apiUrl, 'http://new');
  });

  it('creates a new environment on the fly when one is not yet defined', async () => {
    env = createCliEnv();

    const { status } = await env.run([
      'config', '--env', 'fresh', '--key', 'apiUrl', '--value', 'http://fresh',
    ]);

    assert.strictEqual(status, 0);
    assert.deepStrictEqual(env.readConfig().fresh, { apiUrl: 'http://fresh' });
  });
});
