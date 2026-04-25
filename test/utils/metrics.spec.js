import assert from 'node:assert/strict';
import { readMetrics, writeMetrics, recordUsage } from '../../src/utils/metrics/index.js';

describe('#utils/metrics/readMetrics', () => {
  it('parses the metrics file at the given path', () => {
    const fs = { readFileSync: (p, enc) => {
      assert.strictEqual(p, '/tmp/metrics.json');
      assert.strictEqual(enc, 'utf8');
      return '{"totalUsage":{"a":1},"dailyUsage":{}}';
    } };

    assert.deepStrictEqual(
      readMetrics(fs, '/tmp/metrics.json'),
      { totalUsage: { a: 1 }, dailyUsage: {} }
    );
  });
});

describe('#utils/metrics/writeMetrics', () => {
  it('serializes data with two-space indentation to the given path', () => {
    const calls = [];
    const fs = { writeFileSync: (p, c) => calls.push([p, c]) };

    writeMetrics(fs, '/tmp/metrics.json', { totalUsage: { a: 1 }, dailyUsage: {} });

    assert.deepStrictEqual(calls, [[
      '/tmp/metrics.json',
      '{\n  "totalUsage": {\n    "a": 1\n  },\n  "dailyUsage": {}\n}',
    ]]);
  });
});

describe('#utils/metrics/recordUsage', () => {
  it('increments totalUsage and dailyUsage for the given command', () => {
    const clock = { now: () => new Date('2026-04-25T12:00:00Z') };
    const store = { totalUsage: { foo: 2 }, dailyUsage: {} };

    const next = recordUsage({ store, clock, command: 'foo' });

    assert.strictEqual(next.totalUsage.foo, 3);
    assert.strictEqual(next.dailyUsage['25/04/2026'].foo, 1);
  });

  it('does not mutate the input store', () => {
    const clock = { now: () => new Date('2026-04-25T12:00:00Z') };
    const store = { totalUsage: { foo: 2 }, dailyUsage: {} };

    recordUsage({ store, clock, command: 'foo' });

    assert.deepStrictEqual(store, { totalUsage: { foo: 2 }, dailyUsage: {} });
  });
});
