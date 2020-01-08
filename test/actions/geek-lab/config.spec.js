const execSync = require('child_process').execSync;
const expect = require('expect');
const uuidv1 = require('uuid/v1');

const {
  readConfig,
  writeInternalCliFile,
} = require('../../../src/lib/utils');

const originalConfig = readConfig();
describe('#actions/geek-lab/config', () => {
  //TODO: replace with sinon
  before(() => {
    console.log('making a backup of config file before tests mess with it');
    writeInternalCliFile(
      'bkp_config_geek-lab.json',
      originalConfig
    );
  });

  after(() => {
    console.log('restoring config file');
    writeInternalCliFile(
      'config_geek-lab.json',
      originalConfig
    );
  });

  it('should show cli config when no params are provided', () => {
    const res = execSync('geek-lab config').toString();
    expect(res).toContain('Configuration file can be found at');
  });

  it('should set a config value given a config env and key', (done) => {
    const value = uuidv1();
    const key = `myCustomKey-${value}`;
    const env = `env-${value}`;

    execSync(`geek-lab config --env ${env} --key ${key} --value ${value}`);
    const res = execSync('geek-lab config').toString();

    expect(res).toContain(env);
    expect(res).toContain(key);
    expect(res).toContain(value);
    done();
  });
});