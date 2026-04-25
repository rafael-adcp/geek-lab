import { execSync } from 'child_process';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * command to execute cli via node so that tests can be executed via GitHub Actions
 */
const execBin = `node "${path.resolve(__dirname, '../../bin/geek-lab.js')}"`;
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));

describe('#bin', () => {
  it('should show help if nothing is provided', (done) => {
    try {
      execSync(`${execBin}`);
      done('this shouldnt happen');
    } catch (e) {
      assert.ok((e.toString()).includes('<command>'));
      assert.ok((e.toString()).includes('--help'));
      assert.ok((e.toString()).includes('--version'));
      assert.ok(!(e.toString()).includes('invalid command'));
      assert.ok(!(e.toString()).includes('see available'));
      done();
    }
  });

  it('should show help if --help is provided', () => {
    const res = execSync(`${execBin} --help`).toString();

    assert.ok((res).includes('<command>'));
    assert.ok((res).includes('--help'));
    assert.ok((res).includes('--version'));
    assert.ok(!(res).includes('invalid command'));
    assert.ok(!(res).includes('see available'));
  });

  it('should show version if --version is provided', () => {
    const res = execSync(`${execBin} --version`).toString();

    assert.ok(!(res).includes('<command>'));
    assert.ok(!(res).includes('--help'));
    assert.ok(!(res).includes('invalid command'));
    assert.ok(!(res).includes('see available'));
    assert.ok((res).includes(pkg.version));
  });

  it('should exit non-zero and recommend the closest match for an unknown command', () => {
    try {
      execSync(`${execBin} cgte`);
      throw new Error('expected non-zero exit');
    }
    catch (res) {
      const out = res.toString() + (res.stderr ? res.stderr.toString() : '');
      assert.ok(out.includes('Did you mean cget'), `expected recommendation for "cget", got:\n${out}`);
      assert.ok(out.includes('<command>'), `expected help block, got:\n${out}`);
    }
  });
});
