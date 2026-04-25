import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCliEnv } from '../helpers/e2e.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HANDLEBARS_DIR = path.resolve(__dirname, '../../src/handlebars');

describe('#e2e/metrics', () => {
  let env;
  const generatedReports = [];

  afterEach(() => {
    env?.cleanup();
    env = null;
    while (generatedReports.length) {
      const file = generatedReports.pop();
      try { fs.unlinkSync(file); } catch { /* already gone */ }
    }
  });

  it('prints the metrics file contents as formatted JSON', async () => {
    env = createCliEnv({
      metrics: {
        totalUsage: { 'geek-lab': 7, batman: 3 },
        dailyUsage: { '10/01/2020': { batman: 3 } },
      },
    });

    const { stdout, status } = await env.run(['metrics']);

    assert.strictEqual(status, 0);
    const parsed = JSON.parse(stdout);
    assert.strictEqual(parsed.totalUsage['geek-lab'], 7);
    assert.strictEqual(parsed.totalUsage.batman, 3);
    assert.strictEqual(parsed.dailyUsage['10/01/2020'].batman, 3);
  });

  it('does not update the metrics file when collectMetrics is disabled in config', async () => {
    env = createCliEnv({
      config: { collectMetrics: false },
      metrics: { totalUsage: { 'geek-lab': 5 }, dailyUsage: {} },
    });

    const { status } = await env.run(['metrics']);

    assert.strictEqual(status, 0);
    const after = env.readMetrics();
    assert.strictEqual(after.totalUsage['geek-lab'], 5);
    assert.deepStrictEqual(after.dailyUsage, {});
  });

  it('generates an HTML report under src/handlebars when --pretty is passed', async () => {
    env = createCliEnv({
      metrics: {
        totalUsage: { 'geek-lab': 1, batman: 2, robin: 3 },
        dailyUsage: {
          '10/01/2020': { 'geek-lab': 1, batman: 2 },
          '11/01/2020': { robin: 3 },
        },
      },
    });

    const { stdout, status } = await env.run(['metrics', '--pretty']);

    assert.strictEqual(status, 0);
    const match = stdout.match(/located at\s+(.+awesome_metrics_graph_[^\s]+\.html)/);
    assert.ok(match, `expected report path in stdout, got:\n${stdout}`);

    const reportPath = match[1].trim();
    generatedReports.push(reportPath);

    assert.ok(reportPath.startsWith(HANDLEBARS_DIR));
    const reportContent = fs.readFileSync(reportPath, 'utf8');
    assert.ok(reportContent.includes('batman'));
    assert.ok(reportContent.includes('robin'));
  });
});
