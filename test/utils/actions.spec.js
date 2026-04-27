import assert from 'node:assert/strict';
import path from 'path';
import { listFiles } from '../../src/utils/actions/index.js';

function fakeFs(byDir) {
  return {
    readdirSync: (dir) => {
      const entry = byDir[dir];
      if (entry === 'ENOENT') {
        const e = new Error(`ENOENT: no such file or directory, scandir '${dir}'`);
        e.code = 'ENOENT';
        throw e;
      }
      if (entry === 'EACCES') {
        const e = new Error(`EACCES: permission denied, scandir '${dir}'`);
        e.code = 'EACCES';
        throw e;
      }
      return entry;
    },
  };
}

function file(parentPath, name) {
  return { isFile: () => true, parentPath, name };
}

describe('#utils/actions/listFiles', () => {
  it('skips a missing directory and emits a warning naming it', () => {
    const warnings = [];
    const out = listFiles({
      fs: fakeFs({
        '/missing': 'ENOENT',
        '/present': [file('/present', 'a.js')],
      }),
      pathLib: path,
      dirs: ['/missing', '/present'],
      warn: (msg) => warnings.push(msg),
    });

    assert.deepStrictEqual(out, [path.join('/present', 'a.js')]);
    assert.strictEqual(warnings.length, 1);
    assert.ok(warnings[0].includes('/missing'));
    assert.ok(warnings[0].includes('directory does not exist'));
  });

  it('rethrows non-ENOENT readdir failures (e.g. permission denied)', () => {
    assert.throws(
      () => listFiles({
        fs: fakeFs({ '/locked': 'EACCES' }),
        pathLib: path,
        dirs: ['/locked'],
        warn: () => undefined,
      }),
      /EACCES/
    );
  });
});
