const assert = require('node:assert/strict');
const { createCliEnv } = require('../helpers/e2e');

describe('#e2e/change-env', () => {
  let env;

  afterEach(() => {
    env?.cleanup();
    env = null;
  });

  it('switches the active environment and clears the cached token', async () => {
    env = createCliEnv({
      config: {
        env: 'dev',
        token: 'stale-token',
        tokenExpires: '2099-01-01T00:00:00.000Z',
        prod: { apiUrl: 'https://prod.example' },
      },
    });

    const { stdout, status } = await env.run(['change-env', '--env', 'prod']);

    assert.strictEqual(status, 0);
    assert.ok(stdout.includes('Successfully moved cli to use "prod"'));

    const config = env.readConfig();
    assert.strictEqual(config.env, 'prod');
    assert.strictEqual(config.token, null);
    assert.strictEqual(config.tokenExpires, null);
  });

  it('fails when the target environment is missing from config', async () => {
    env = createCliEnv({ config: { env: 'dev' } });

    const { status, stdout, stderr } = await env.run(['change-env', '--env', 'unknown']);

    assert.notStrictEqual(status, 0);
    const output = stdout + stderr;
    assert.ok(
      output.includes('Environment dont exist on cli configuration'),
      `expected error message, got:\n${output}`
    );
    assert.strictEqual(env.readConfig().env, 'dev');
  });

  it('fails when --env is not provided', async () => {
    env = createCliEnv();

    const { status, stdout, stderr } = await env.run(['change-env']);

    assert.notStrictEqual(status, 0);
    assert.ok((stdout + stderr).includes('--env'));
  });
});
