const expect = require('expect');

const {
  getConfigValue,
  writeInternalCliFile,
  readConfig,
} = require('../../src/lib/utils');

describe('#src/lib/utils/lib/getConfigValue', () => {
  //TODO: use before / after
  //generate the first 3 tests dynamically since they are pretty much the same

  it('should throw error when env is not available', (done) => {
    const originalConfig = readConfig();
    //preserving previous config to prevent spamming on it
    writeInternalCliFile(
      'bkp_config_geek-lab.json',
      originalConfig
    );

    writeInternalCliFile(
      'config_geek-lab.json',
      {}
    );

    try {
      getConfigValue('this should never happen');
      done('this shouldnt happen');
    } catch (e) {

      expect(e.toString()).toContain('Invalid env for cli');
      //moving config back to original
      writeInternalCliFile(
        'config_geek-lab.json',
        originalConfig
      );
      done();
    }
  });

  it('should throw error when env config is empty', (done) => {
    const originalConfig = readConfig();
    //preserving previous config to prevent spamming on it
    writeInternalCliFile(
      'bkp_config_geek-lab.json',
      originalConfig
    );

    writeInternalCliFile(
      'config_geek-lab.json',
      {
        'env': 'test',
        'test': {},
      }
    );

    try {
      getConfigValue('this should never happen');
      done('this shouldnt happen');
    } catch (e) {

      expect(e.toString()).toContain('Environment test is not set on config file');
      //moving config back to original
      writeInternalCliFile(
        'config_geek-lab.json',
        originalConfig
      );
      done();
    }
  });

  it('should throw error when env config exists but field doesnt', (done) => {
    const originalConfig = readConfig();
    //preserving previous config to prevent spamming on it
    writeInternalCliFile(
      'bkp_config_geek-lab.json',
      originalConfig
    );

    writeInternalCliFile(
      'config_geek-lab.json',
      {
        'env': 'test',
        'test': {
          'oneValidKey': 'blah',
        },
      }
    );

    try {
      getConfigValue('this should never happen');
      done('this shouldnt happen');
    } catch (e) {

      expect(e.toString()).toContain('Key "this should never happen" is not set for environment "test"');
      //moving config back to original
      writeInternalCliFile(
        'config_geek-lab.json',
        originalConfig
      );
      done();
    }
  });

  it('should returl value when env and key exists', () => {
    const originalConfig = readConfig();
    //preserving previous config to prevent spamming on it
    writeInternalCliFile(
      'bkp_config_geek-lab.json',
      originalConfig
    );

    writeInternalCliFile(
      'config_geek-lab.json',
      {
        'env': 'test',
        'test': {
          'oneValidKey': 'blah',
        },
      }
    );

    const value = getConfigValue('oneValidKey');
    expect(value).toBe('blah');
    //moving config back to original
    writeInternalCliFile(
      'config_geek-lab.json',
      originalConfig
    );
  });
});