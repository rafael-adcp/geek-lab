import assert from 'node:assert/strict';
import { buildReportData, renderReport } from '../../src/utils/metrics/report.js';

function counterId() {
  let n = 0;
  return (prefix) => `${prefix}_${n++}`;
}

describe('#utils/metrics/report/buildReportData', () => {
  it('returns empty graph entries when the store has no actions', () => {
    const data = buildReportData({ totalUsage: {}, dailyUsage: {} }, counterId());

    assert.strictEqual(data.generatedOverallGraph.length, 2);
    assert.deepStrictEqual(JSON.parse(data.generatedOverallGraph[0].data), []);
    assert.deepStrictEqual(JSON.parse(data.generatedOverallGraph[1].data), []);
    assert.deepStrictEqual(data.generatedEachActionGraph, []);
  });

  it('builds the donut series from totalUsage', () => {
    const data = buildReportData({
      totalUsage: { foo: 3, bar: 1 },
      dailyUsage: {},
    }, counterId());

    assert.deepStrictEqual(
      JSON.parse(data.generatedOverallGraph[0].data),
      [['foo', 3], ['bar', 1]]
    );
    assert.strictEqual(data.generatedOverallGraph[0].type, 'donut');
    assert.strictEqual(data.generatedOverallGraph[0].name, 'Total Usage');
  });

  it('zero-fills missing days per action in the line series', () => {
    const data = buildReportData({
      totalUsage: { foo: 5, bar: 2 },
      dailyUsage: {
        '01/01/2026': { foo: 3 },
        '02/01/2026': { foo: 2, bar: 2 },
      },
    }, counterId());

    assert.deepStrictEqual(
      JSON.parse(data.generatedOverallGraph[1].data),
      [
        ['foo', 3, 2],
        ['bar', 0, 2],
      ]
    );
    assert.deepStrictEqual(
      JSON.parse(data.generatedOverallGraph[1].categories),
      ['01/01/2026', '02/01/2026']
    );
  });

  it('emits one per-action entry with grid-flag pattern open/-/close repeating', () => {
    const data = buildReportData({
      totalUsage: { a: 1, b: 1, c: 1, d: 1, e: 1 },
      dailyUsage: {},
    }, counterId());

    const flags = data.generatedEachActionGraph.map(({ openNewRow, closeRow }) => ({ openNewRow, closeRow }));
    assert.deepStrictEqual(flags, [
      { openNewRow: true, closeRow: false },
      { openNewRow: false, closeRow: false },
      { openNewRow: false, closeRow: true },
      { openNewRow: true, closeRow: false },
      { openNewRow: false, closeRow: false },
    ]);
  });

  it('uses the injected genId for every chart id', () => {
    const data = buildReportData({
      totalUsage: { foo: 1, bar: 1 },
      dailyUsage: {},
    }, counterId());

    assert.strictEqual(data.generatedOverallGraph[0].id, 'graphic_0');
    assert.strictEqual(data.generatedOverallGraph[1].id, 'graphic_1');
    assert.strictEqual(data.generatedEachActionGraph[0].id, 'graphic_each_action_2');
    assert.strictEqual(data.generatedEachActionGraph[1].id, 'graphic_each_action_3');
  });
});

describe('#utils/metrics/report/renderReport', () => {
  it('reads the template from fs at the configured path, compiles it through handlebars, and applies the report view-model', () => {
    const reads = [];
    const fs = {
      readFileSync: (p, enc) => {
        reads.push([p, enc]);
        return 'TEMPLATE_SOURCE';
      },
    };
    const compiled = [];
    const handlebars = {
      compile: (src) => {
        compiled.push(src);
        return (data) => `rendered:${data.generatedOverallGraph.length}:${data.generatedEachActionGraph.length}`;
      },
    };

    const out = renderReport({
      fs,
      handlebars,
      templatePath: '/etc/template.hb',
      store: { totalUsage: { foo: 1 }, dailyUsage: {} },
      genId: counterId(),
    });

    assert.deepStrictEqual(reads, [['/etc/template.hb', 'utf8']]);
    assert.deepStrictEqual(compiled, ['TEMPLATE_SOURCE']);
    // 2 overall graph entries + 1 per-action entry
    assert.strictEqual(out, 'rendered:2:1');
  });
});
