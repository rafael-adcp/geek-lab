const expect = require('expect');
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
    expect(readMetricsFileStub.calledOnce).toEqual(true);
    expect(JSON.parse(res)).toEqual(mockedConfigFileContent);
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

    expect(writeFileSyncStub.calledOnce).toEqual(true);
    expect(readMetricsFileStub.calledOnce).toEqual(true);
    expect(res).toContain('Html report generated and located at');

    //asserting the fileName provided to fs.writeFileSync
    expect(writeFileSyncStub.getCall(0).args[0]).not.toBe(null);
    expect(writeFileSyncStub.getCall(0).args[0]).toContain('awesome_metrics');

    //asserting the content provided to fs.writeFileSync
    expect(writeFileSyncStub.getCall(0).args[1]).toContain('Geek lab metrics');
    expect(writeFileSyncStub.getCall(0).args[1]).toContain('batman');
  });
});