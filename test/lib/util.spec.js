const expect = require('expect');

const {
  getConfigValue,
  writeInternalCliFile,
  readConfig,
  performRequest,
} = require('../../src/lib/utils');
const originalConfig = readConfig();
describe('#src/lib/utils/lib/getConfigValue', () => {
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
  [
    {
      testName: 'should throw error when env is not available',
      configKey: 'this should never happen',
      data: {},
      errorMessage: 'Invalid env for cli',
    },

    {
      testName: 'should throw error when env config is empty',
      configKey: 'this should never happen',
      data: {
        'env': 'test',
        'test': {},
      },
      errorMessage: 'Environment test is not set on config file',
    },

    {
      testName: 'should throw error when env config exists but field doesnt',
      configKey: 'this should never happen',
      data: {
        'env': 'test',
        'test': {
          'oneValidKey': 'blah',
        },
      },
      errorMessage: 'Key "this should never happen" is not set for environment "test"',
    },

  ].forEach((element) => {
    it(element.testName, (done) => {
      writeInternalCliFile(
        'config_geek-lab.json',
        element.data
      );

      try {
        getConfigValue(element.configKey);
        done('this shouldnt happen');
      } catch (e) {
        expect(e.toString()).toContain(element.errorMessage);
        done();
      }
    });
  });

  it('should returl value when env and key exists', () => {
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
  });
});

describe('#src/lib/utils/lib/performRequest', () => {
  [
    {
      testName: 'should thow error if params is null',
      errorMessage: 'No params were provided',
    },
    {
      testName: 'should thow error if params is an empty object',
      params: {},
      errorMessage: 'No params were provided',
    },

    {
      testName: 'should thow error if params.method is null',
      params: {
        method: null,
      },
      errorMessage: 'To perform a request you must provide at least a method and an endpoint',
    },
    {
      testName: 'should thow error if params.endpoint is null',
      params: {
        endpoint: null,
      },
      errorMessage: 'To perform a request you must provide at least a method and an endpoint',
    },

    {
      testName: 'should thow error if params.method is invalid',
      params: {
        method: 'goku',
        endpoint: '/batman',
      },
      errorMessage: 'Invalid method provided',
    },
  ].forEach((element) => {
    it(element.testName, (done) => {
      performRequest(element.params).catch((e) => {
        expect(e.toString()).toContain(element.errorMessage);
        done();
      });
    });
  });
});