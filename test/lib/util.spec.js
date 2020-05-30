const expect = require('expect');
const sinon = require('sinon');
const fs = require('fs');
const moment = require('moment');
const mysql2 = require('mysql2/promise');

const {
  getConfigValue,
  performRequest,
  readInternalCliFile,
  writeInternalCliFile,
  collectMetrics,
  performMySQLQuery,
} = require('../../src/lib/utils');

const utils = require('../../src/lib/utils');

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
  afterEach(() => {
    sinon.restore();
  });

  it('should read json file if starts with @', (done) => {
    const readFileSyncStub = sinon.stub().returns({
      testReadFile: 'mocked read file',
    });

    sinon.replace(fs, 'readFileSync', readFileSyncStub);

    performRequest({
      data: '@mocked.json',
    }).catch(() => {
      expect(readFileSyncStub.calledOnce).toBe(true);
      done();
    });
  });

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
  afterEach(() => {
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
  afterEach(() => {
    sinon.restore();
  });

  it('should throw error if failed to write cli file', (done) => {

    const fnStub = sinon.stub().throws(new Error('muhahaha'));
    sinon.replace(fs, 'writeFileSync', fnStub);

    try {
      writeInternalCliFile('batman');
      done('nooo');
    } catch (e) {
      expect(e.toString()).toContain('Failed to write file');
      done();
    }
  });
});

describe('#src/lib/utils/lib/collectMetrics', () => {
  afterEach(() => {
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
    const stubCalledParams = writeInternalCliFileStub.getCall(0);

    expect(writeInternalCliFileStub.calledOnce).toBe(true);
    expect(stubCalledParams.toString()).toContain(`{ ${moment(new Date()).format('DD/MM/YYYY')}: { magicInMe: 1 } }`);
    expect(stubCalledParams.toString()).toContain('magicInMe: 1');

  });

  it('should not track metrics if config variable is false', () => {
    const readConfigStub = sinon.stub().returns({
      'collectMetrics': false,
    });

    sinon.replace(utils, 'readConfig', readConfigStub);

    const writeInternalCliFileStub = sinon.stub().returns();
    sinon.replace(utils, 'writeInternalCliFile', writeInternalCliFileStub);

    collectMetrics('magicInMe');
    expect(writeInternalCliFileStub.calledOnce).toBe(false);
  });

  it('should reuse entry while tracking metrics if available', () => {
    const readConfigStub = sinon.stub().returns({
      'collectMetrics': true,
    });

    sinon.replace(utils, 'readConfig', readConfigStub);

    const readInternalCliFileStub = sinon.stub().returns({
      'totalUsage': {
        'magicInMe': 1,
      },
      'dailyUsage': {
        [moment(new Date()).format('DD/MM/YYYY')]: {
          magicInMe: 1,
        },
      },
    });

    sinon.replace(utils, 'readInternalCliFile', readInternalCliFileStub);

    const writeInternalCliFileStub = sinon.stub().returns();
    sinon.replace(utils, 'writeInternalCliFile', writeInternalCliFileStub);

    collectMetrics('magicInMe');
    const stubCalledParams = writeInternalCliFileStub.getCall(0);

    expect(writeInternalCliFileStub.calledOnce).toBe(true);
    expect(stubCalledParams.toString()).toContain(`{ ${moment(new Date()).format('DD/MM/YYYY')}: { magicInMe: 2 } }`);
    expect(stubCalledParams.toString()).toContain('magicInMe: 2');

  });

});

describe('#src/lib/utils/lib/performMySQLQuery', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('should execute the given mysql query', (done) => {

    const fnStub = sinon.stub().returns('foo');
    sinon.replace(utils, 'getConfigValue', fnStub);

    const fake = {};
    fake.execute = (query) => {
      return Promise.resolve('executed: ' + query);
    };

    fake.destroy = () => {
      return Promise.resolve();
    };

    const mySqlStub = sinon.stub().resolves(fake);

    sinon.replace(mysql2, 'createConnection', mySqlStub);

    const executeStub = sinon.stub().resolves(
      [
        [
          { id: 2, nome: 'aaaa' },
          { id: 3, nome: 'rrewgrhewerh' },
        ],
        [{
          catalog: 'def',
          schema: 'test',
          name: 'id',
          orgName: 'id',
          table: 'users',
          orgTable: 'users',
          characterSet: 63,
          columnLength: 11,
          columnType: 3,
          flags: 16899,
          decimals: 0,
        },
        {
          catalog: 'def',
          schema: 'test',
          name: 'nome',
          orgName: 'nome',
          table: 'users',
          orgTable: 'users',
          characterSet: 224,
          columnLength: 200,
          columnType: 253,
          flags: 4097,
          decimals: 0,
        }]]
    );

    sinon.replace(fake, 'execute', executeStub);

    const query = 'some query in here';
    performMySQLQuery(query).then((res) => {
      const stubCalledParams = executeStub.getCall(0);
      expect(res).not.toBe(null);
      expect(executeStub.calledOnce).toBe(true);
      expect(stubCalledParams.toString()).toContain(query);
      done();
    });
  });
});