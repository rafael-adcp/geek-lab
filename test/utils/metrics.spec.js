import assert from 'node:assert/strict';
import { readMetrics, writeMetrics, recordUsage, recordCommand } from '../../src/utils/metrics/index.js';

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

describe('#utils/metrics/recordCommand', () => {
  function fakeFs(initial) {
    let store = JSON.stringify(initial);
    return {
      writes: [],
      readFileSync: () => store,
      writeFileSync(p, c) { this.writes.push([p, c]); store = c; },
    };
  }
  const clock = { now: () => new Date('2026-04-25T12:00:00Z') };

  it('skips reads and writes when enabled is false', () => {
    const fs = { readFileSync: () => { throw new Error('should not read'); }, writeFileSync: () => { throw new Error('should not write'); } };

    recordCommand({ fs, metricsPath: '/m.json', clock, command: 'foo', enabled: false });
  });

  it('persists an incremented store when enabled', () => {
    const fs = fakeFs({ totalUsage: { foo: 2 }, dailyUsage: {} });

    recordCommand({ fs, metricsPath: '/m.json', clock, command: 'foo', enabled: true });

    assert.strictEqual(fs.writes.length, 1);
    const written = JSON.parse(fs.writes[0][1]);
    assert.strictEqual(written.totalUsage.foo, 3);
    assert.strictEqual(written.dailyUsage['25/04/2026'].foo, 1);
  });

  it('records empty commands as the literal "geek-lab"', () => {
    const fs = fakeFs({ totalUsage: {}, dailyUsage: {} });

    recordCommand({ fs, metricsPath: '/m.json', clock, command: '', enabled: true });

    const written = JSON.parse(fs.writes[0][1]);
    assert.strictEqual(written.totalUsage['geek-lab'], 1);
  });

  it('records nullish commands as "geek-lab" too', () => {
    const fs = fakeFs({ totalUsage: {}, dailyUsage: {} });

    recordCommand({ fs, metricsPath: '/m.json', clock, command: undefined, enabled: true });

    const written = JSON.parse(fs.writes[0][1]);
    assert.strictEqual(written.totalUsage['geek-lab'], 1);
  });
});
