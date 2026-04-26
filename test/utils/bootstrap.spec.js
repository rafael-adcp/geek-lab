import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { loadMysql2, scheduleUpdateNotifier } from '../../src/utils/bootstrap/index.js';

describe('#utils/bootstrap/loadMysql2', () => {
  let tmpDir;
  let shimPath;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'glab-bootstrap-'));
    shimPath = path.join(tmpDir, 'mysql2-shim.mjs');
    fs.writeFileSync(shimPath, `export default { __label: 'override-shim' };\n`);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('honors GEEK_LAB_MYSQL2_MODULE when set', async () => {
    const driver = await loadMysql2({ GEEK_LAB_MYSQL2_MODULE: shimPath });
    assert.strictEqual(driver.__label, 'override-shim');
  });

  it('falls back to mysql2/promise when the env var is unset', async () => {
    const driver = await loadMysql2({});
    assert.strictEqual(typeof driver.createConnection, 'function');
  });
});

describe('#utils/bootstrap/scheduleUpdateNotifier', () => {
  it('runs notify() on a successful import', async () => {
    let notified = false;
    const importer = () => Promise.resolve({
      default: () => ({ notify: () => { notified = true; } }),
    });
    await scheduleUpdateNotifier({
      pkg: { name: 'x', version: '1.0.0' },
      importer,
      isDebug: () => false,
    });
    assert.strictEqual(notified, true);
  });

  it('stays silent on import failure when isDebug returns false', async () => {
    const captured = [];
    const originalError = console.error;
    console.error = (...a) => captured.push(a);
    try {
      await scheduleUpdateNotifier({
        pkg: { name: 'x' },
        isDebug: () => false,
        importer: () => Promise.reject(new Error('boom')),
      });
    } finally {
      console.error = originalError;
    }
    assert.deepStrictEqual(captured, []);
  });

  it('logs to stderr on import failure when isDebug returns true', async () => {
    const captured = [];
    const originalError = console.error;
    console.error = (...a) => captured.push(a);
    try {
      await scheduleUpdateNotifier({
        pkg: { name: 'x' },
        isDebug: () => true,
        importer: () => Promise.reject(new Error('boom')),
      });
    } finally {
      console.error = originalError;
    }
    assert.strictEqual(captured.length, 1);
    assert.ok(captured[0][0].includes('update-notifier check failed'));
    assert.ok(captured[0][1] instanceof Error);
  });

  it('stays silent when isDebug itself throws (e.g. unreadable config)', async () => {
    const captured = [];
    const originalError = console.error;
    console.error = (...a) => captured.push(a);
    try {
      await scheduleUpdateNotifier({
        pkg: { name: 'x' },
        isDebug: () => { throw new Error('config unreadable'); },
        importer: () => Promise.reject(new Error('boom')),
      });
    } finally {
      console.error = originalError;
    }
    assert.deepStrictEqual(captured, []);
  });
});
