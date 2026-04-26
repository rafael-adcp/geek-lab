import assert from 'node:assert/strict';
import { createCliEnv } from '../helpers/e2e.js';

const cases = [
  { command: 'auth', describe: 'performs api authentication' },
  { command: 'config', describe: 'show and perform changes on config file' },
  { command: 'change-env', describe: 'swap cli between environments' },
  { command: 'custom-actions', describe: 'show current custom-actions for cli' },
  { command: 'default-actions', describe: 'show current default-actions for cli' },
  { command: 'metrics', describe: 'show current metrics for cli' },
  { command: 'cget', describe: 'performs a GET request' },
  { command: 'cpost', describe: 'performs a POST request' },
  { command: 'cput', describe: 'performs a PUT request' },
  { command: 'cdelete', describe: 'performs a DELETE request' },
  { command: 'mysql', describe: 'execute a mysql query' },
  { command: 'mysql-describe-table', describe: 'describe a mysql table' },
  { command: 'mysql-find-column', describe: 'search mysql columns by name' },
  { command: 'mysql-find-table', describe: 'search mysql tables by name' },
];

describe('#e2e/per-command-help', () => {
  let env;

  afterEach(() => {
    env?.cleanup();
    env = null;
  });

  cases.forEach(({ command, describe: describeText }) => {
    it(`gik ${command} --help exits 0 and includes the command's describe`, async () => {
      env = createCliEnv();

      const { stdout, status } = await env.run([command, '--help']);

      assert.strictEqual(status, 0, `expected exit 0 for "${command} --help"`);
      assert.ok(
        stdout.includes(describeText),
        `expected stdout to contain "${describeText}", got:\n${stdout}`
      );
    });
  });
});
