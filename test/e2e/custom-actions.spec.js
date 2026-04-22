const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { createCliEnv } = require('../helpers/e2e');

describe('#e2e/custom-actions', () => {
  let env;

  afterEach(() => {
    env?.cleanup();
    env = null;
  });

  it('prints the header with no action entries when customActionsPath is empty', async () => {
    env = createCliEnv({ config: { customActionsPath: [] } });

    const { stdout, status } = await env.run(['custom-actions']);

    assert.strictEqual(status, 0);
    assert.ok(stdout.includes('Custom actions are located at:'));
  });

  it('lists every file discovered under customActionsPath', async () => {
    env = createCliEnv();

    const customDir = path.join(env.home, 'my-actions');
    fs.mkdirSync(customDir);
    const actionPath = path.join(customDir, 'my-action.js');
    fs.writeFileSync(
      actionPath,
      `exports.command = 'my-custom-command';
exports.describe = 'e2e fixture';
exports.builder = (y) => y;
exports.handler = () => {};
`
    );

    const cfg = env.readConfig();
    cfg.customActionsPath = [customDir];
    env.writeConfig(cfg);

    const { stdout, status } = await env.run(['custom-actions']);

    assert.strictEqual(status, 0);
    assert.ok(stdout.includes('Custom actions are located at:'));
    assert.ok(
      stdout.includes('my-action.js'),
      `expected the custom action file name in stdout, got:\n${stdout}`
    );
  });
});
