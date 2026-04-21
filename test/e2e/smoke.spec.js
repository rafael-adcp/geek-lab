const assert = require('node:assert/strict');
const { createCliEnv } = require('../helpers/e2e');

describe('#e2e/smoke', () => {
  let env;

  afterEach(() => {
    env?.cleanup();
    env = null;
  });

  it('runs the CLI against an isolated geek-lab_local directory', () => {
    env = createCliEnv({ config: { env: 'my-custom-env' } });

    const { stdout, status } = env.run(['config']);

    assert.strictEqual(status, 0);
    assert.ok(
      stdout.includes('my-custom-env'),
      `expected stdout to contain the seeded env, got:\n${stdout}`
    );
    assert.ok(
      stdout.includes(env.home),
      `expected stdout to echo the isolated HOME (${env.home}), got:\n${stdout}`
    );
  });
});
