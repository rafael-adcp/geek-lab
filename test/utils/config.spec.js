const assert = require('node:assert/strict');
const { resolveValue } = require('../../src/utils/config');

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
