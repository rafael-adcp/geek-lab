const assert = require('node:assert/strict');
const { v1: uuidv1 } = require('uuid');
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
        assert.ok((e.toString()).includes(element.errorMessage));
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

    assert.strictEqual(readConfigStub.calledOnce, true);
    assert.strictEqual(writeInternalCliFileStub.calledOnce, true);
  });
});