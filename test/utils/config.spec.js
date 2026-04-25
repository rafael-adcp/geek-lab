import assert from 'node:assert/strict';
import { resolveValue, writeConfig } from '../../src/utils/config/index.js';

describe('#utils/config/writeConfig', () => {
  it('serializes data with two-space indentation to the given path', () => {
    const calls = [];
    const fs = { writeFileSync: (p, c) => calls.push([p, c]) };

    writeConfig(fs, '/tmp/config.json', { env: 'dev', dev: { k: 'v' } });

    assert.deepStrictEqual(calls, [[
      '/tmp/config.json',
      '{\n  "env": "dev",\n  "dev": {\n    "k": "v"\n  }\n}',
    ]]);
  });
});

describe('#utils/config/resolveValue', () => {
  it('throws when env is missing from config', () => {
    assert.throws(() => resolveValue({}, 'any'), /Invalid env for cli/);
  });

  it('throws when the active env block is empty', () => {
    assert.throws(
      () => resolveValue({ env: 'test', test: {} }, 'any'),
      /Environment test is not set on config file/
    );
  });

  it('throws when the requested key is missing in the active env', () => {
    assert.throws(
      () => resolveValue({ env: 'test', test: { other: 'x' } }, 'missing'),
      /Key "missing" is not set for environment "test"/
    );
  });

  it('returns the value when env and key are both present', () => {
    assert.strictEqual(
      resolveValue({ env: 'test', test: { k: 'v' } }, 'k'),
      'v'
    );
  });
});
