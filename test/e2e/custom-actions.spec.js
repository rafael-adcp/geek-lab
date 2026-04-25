import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import { createCliEnv } from '../helpers/e2e.js';

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

  it('exits non-zero with a duplicate-command error when a custom action collides with a built-in command', async () => {
    env = createCliEnv();

    const customDir = path.join(env.home, 'my-actions');
    fs.mkdirSync(customDir);
    fs.writeFileSync(
      path.join(customDir, 'shadow-cget.js'),
      `module.exports = () => ({
  command: 'cget',
  describe: 'colliding action',
  builder: (y) => y,
  handler: () => {},
});
`
    );

    const cfg = env.readConfig();
    cfg.customActionsPath = [customDir];
    env.writeConfig(cfg);

    const { stdout, stderr, status } = await env.run(['cget']);

    assert.notStrictEqual(status, 0);
    assert.ok(
      (stdout + stderr).includes('Duplicate command provided'),
      `expected duplicate-command error message, got:\n${stdout}\n${stderr}`
    );
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
