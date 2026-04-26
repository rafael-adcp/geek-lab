import { execSync } from 'child_process';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const execBin = `node "${path.resolve(__dirname, '../../bin/geek-lab.js')}"`;
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));

// yargs honors LANG/LC_ALL for help text. Lock to English so the assertions
// (e.g. '<command>' vs '<comando>') hold regardless of the host OS locale.
const EN_ENV = { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8', LANGUAGE: 'en' };

function runExpectingFailure(cmd) {
  try {
    execSync(cmd, { env: EN_ENV });
    throw new Error(`expected non-zero exit from: ${cmd}`);
  } catch (e) {
    return {
      status: e.status,
      output: (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? '') + e.toString(),
    };
  }
}

function runExpectingSuccess(cmd) {
  return execSync(cmd, { env: EN_ENV }).toString();
}

describe('#bin/no-args', () => {
  it('exits non-zero', () => {
    assert.notStrictEqual(runExpectingFailure(execBin).status, 0);
  });

  it('renders the help block listing the built-in commands', () => {
    const { output } = runExpectingFailure(execBin);
    assert.ok(output.includes('auth'), `expected 'auth' in help output, got:\n${output}`);
    assert.ok(output.includes('cget'), `expected 'cget' in help output, got:\n${output}`);
  });
});

describe('#bin/--help', () => {
  it('exits zero', () => {
    runExpectingSuccess(`${execBin} --help`);
  });

  it('renders the help block listing the built-in commands', () => {
    const out = runExpectingSuccess(`${execBin} --help`);
    assert.ok(out.includes('auth'));
    assert.ok(out.includes('cget'));
  });
});

describe('#bin/--version', () => {
  it('prints the package version from package.json', () => {
    const out = runExpectingSuccess(`${execBin} --version`);
    assert.ok(out.includes(pkg.version), `expected version ${pkg.version}, got:\n${out}`);
  });
});

describe('#bin/unknown command', () => {
  it('exits non-zero', () => {
    assert.notStrictEqual(runExpectingFailure(`${execBin} cgte`).status, 0);
  });

  it('recommends the closest matching command (cgte → cget)', () => {
    const { output } = runExpectingFailure(`${execBin} cgte`);
    assert.ok(
      output.includes('Did you mean cget'),
      `expected recommendation for "cget", got:\n${output}`
    );
  });
});
