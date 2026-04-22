const assert = require('node:assert/strict');
const { createCliEnv } = require('../helpers/e2e');

describe('#e2e/default-actions', () => {
  let env;

  afterEach(() => {
    env?.cleanup();
    env = null;
  });

  it('prints the default action file paths under src/actions', async () => {
    env = createCliEnv();

    const { stdout, status } = await env.run(['default-actions']);

    assert.strictEqual(status, 0);
    assert.ok(stdout.includes('Default actions are located at:'));
    assert.ok(stdout.includes('auth.js'));
    assert.ok(stdout.includes('cget.js'));
    assert.ok(stdout.includes('mysql.js'));
  });
});
