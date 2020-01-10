const expect = require('expect');
const uuidv1 = require('uuid/v1');
const yargs = require('yargs');
const sinon = require('sinon');

const changeEnv = require('../../../src/actions/geek-lab/change-env');

describe('#actions/geek-lab/change-env', () => {
  afterEach(() => {
    sinon.restore();
  });

  [
    {
      command: changeEnv,
      errorMessage: 'Parameter env cant be empty',
      testName: 'should throw error if env isnt provided',
    },
    {
      command: changeEnv,
      params: { env: uuidv1() },
      errorMessage: 'Environment dont exist on cli configuration',
      testName: 'should throw an error if env isnt available on cli config',
    },
  ].forEach((element) => {
    it(element.testName, (done) => {
      try {
        element.command.builder(yargs);
        element.command.handler(
          element.params ? element.params : {}
        );
      } catch (e) {
        expect(e.toString()).toContain(element.errorMessage);
        done();
      }

    });
  });

  it('should change cli env', () => {
    const utils = require('../../../src/lib/utils');
    const readConfigStub = sinon.stub().returns({
      'env': null,
      'batman': {},
    });
    sinon.replace(utils, 'readConfig', readConfigStub);

    const writeInternalCliFileStub = sinon.stub().returns({});
    sinon.replace(utils, 'writeInternalCliFile', writeInternalCliFileStub);

    changeEnv.handler({
      env: 'batman',
    });

    expect(readConfigStub.calledOnce).toBe(true);
    expect(writeInternalCliFileStub.calledOnce).toBe(true);
  });
});