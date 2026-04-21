const assert = require('node:assert/strict');
const yargs = require('yargs');
const sinon = require('sinon');

const action = require('../../../src/actions/geek-lab/metrics');
const utils = require('../../../src/lib/utils');

const mockedConfigFileContent = {
  'totalUsage': {
    'geek-lab': 10,
    'batman': 20,
    'test': 5,
  },
  'dailyUsage': {
    '10/01/2020': {
      'geek-lab': 6,
      'test': 5,
    },
    '11/01/2020': {
      'geek-lab': 4,
      'batman': 20,
    },
  },
};

describe('#actions/geek-lab/metrics', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('calling yargs builder', () => {
    action.builder(yargs);
  });

  it('should print metrics file as it is if no param if provided', () => {

    const readMetricsFileStub = sinon.stub().returns(mockedConfigFileContent);

    sinon.replace(utils, 'readMetricsFile', readMetricsFileStub);
    const res = action.handler({});
    assert.deepStrictEqual(readMetricsFileStub.calledOnce, true);
    assert.deepStrictEqual(JSON.parse(res), mockedConfigFileContent);
  });

  it('should generate an html repot if param is provided', () => {
    const readMetricsFileStub = sinon.stub().returns(mockedConfigFileContent);
    sinon.replace(utils, 'readMetricsFile', readMetricsFileStub);

    const fs = require('fs');
    const writeFileSyncStub = sinon.stub().returns({});
    sinon.replace(fs, 'writeFileSync', writeFileSyncStub);

    const res = action.handler({
      'pretty': true,
    });

    assert.deepStrictEqual(writeFileSyncStub.calledOnce, true);
    assert.deepStrictEqual(readMetricsFileStub.calledOnce, true);
    assert.ok((res).includes('Html report generated and located at'));

    //asserting the fileName provided to fs.writeFileSync
    assert.notStrictEqual(writeFileSyncStub.getCall(0).args[0], null);
    assert.ok((writeFileSyncStub.getCall(0).args[0]).includes('awesome_metrics'));

    //asserting the content provided to fs.writeFileSync
    assert.ok((writeFileSyncStub.getCall(0).args[1]).includes('Geek lab metrics'));
    assert.ok((writeFileSyncStub.getCall(0).args[1]).includes('batman'));
  });
});