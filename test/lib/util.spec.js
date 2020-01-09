const expect = require('expect');

const {
  getConfigValue,
  performRequest,
  readInternalCliFile,
  writeInternalCliFile,
  collectMetrics,
} = require('../../src/lib/utils');

const sinon = require('sinon');
const utils = require('../../src/lib/utils');
const fs = require('fs');

describe('#src/lib/utils/lib/getConfigValue', () => {
  afterEach(() => {
    sinon.restore();
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
      const fnStub = sinon.stub().returns(element.data);
      sinon.replace(utils, 'readConfig', fnStub);

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
    const fnStub = sinon.stub().returns(
      {
        'env': 'test',
        'test': {
          'oneValidKey': 'blah',
        },
      }
    );
    sinon.replace(utils, 'readConfig', fnStub);

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

describe('#src/lib/utils/lib/readInternalCliFile', () => {
  after(() => {
    sinon.restore();
  });

  it('should throw error if failed to read internal cli file', () => {
    const fnStub = sinon.stub().throws(new Error('muhahaha'));
    sinon.replace(fs, 'readFileSync', fnStub);

    try {
      readInternalCliFile('batman');
    } catch (e) {
      expect(e.toString()).toContain('Error: Failed to read file');
    }
  });
});

describe('#src/lib/utils/lib/writeInternalCliFile', () => {
  after(() => {
    sinon.restore();
  });

  it('should throw error if failed to read internal cli file', () => {

    const fnStub = sinon.stub().throws(new Error('muhahaha'));
    sinon.replace(fs, 'writeFileSync', fnStub);

    try {
      writeInternalCliFile('batman');
    } catch (e) {
      expect(e.toString()).toContain('Failedfdfdfdf to write file');
    }
  });
});

describe('#src/lib/utils/lib/collectMetrics', () => {
  after(() => {
    sinon.restore();
  });

  it('should track metrics if config variable is true', () => {
    const readConfigStub = sinon.stub().returns({
      'collectMetrics': true,
    });

    sinon.replace(utils, 'readConfig', readConfigStub);

    const readInternalCliFileStub = sinon.stub().returns({
      'totalUsage': {},
      'dailyUsage': {},
    });

    sinon.replace(utils, 'readInternalCliFile', readInternalCliFileStub);

    const writeInternalCliFileStub = sinon.stub().returns();
    sinon.replace(utils, 'writeInternalCliFile', writeInternalCliFileStub);

    collectMetrics('magicInMe');
  });

});