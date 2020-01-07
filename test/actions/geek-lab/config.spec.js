const execSync = require('child_process').execSync;
const expect = require('expect');
const uuidv1 = require('uuid/v1');

const {
  readConfig,
  writeInternalCliFile,
} = require('../../../src/lib/utils');

describe('#actions/geek-lab/config', () => {
  //TODO: use before / after
  it('should show cli config when no params are provided', () => {
    const res = execSync('geek-lab config').toString();
    expect(res).toContain('Configuration file can be found at');
  });

  it('should set a config value given a config env and key', (done) => {
    const originalConfig = readConfig();

    //preserving previous config to prevent spamming on it
    writeInternalCliFile(
      'bkp_config_geek-lab.json',
      originalConfig
    );

    const value = uuidv1();
    const key = `myCustomKey-${value}`;
    const env = `env-${value}`;

    execSync(`geek-lab config --env ${env} --key ${key} --value ${value}`);
    let res = execSync('geek-lab config').toString();

    expect(res).toContain(env);
    expect(res).toContain(key);
    expect(res).toContain(value);

    //moving config back to original
    writeInternalCliFile(
      'config_geek-lab.json',
      originalConfig
    );

    res = execSync('geek-lab config').toString();
    expect(res).not.toContain(env);
    expect(res).not.toContain(key);
    expect(res).not.toContain(value);
    done();
  });
});