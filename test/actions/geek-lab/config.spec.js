const assert = require('node:assert/strict');
const { v1: uuidv1 } = require('uuid');
const sinon = require('sinon');
const yargs = require('yargs');

const configAction = require('../../../src/actions/geek-lab/config');
const utils = require('../../../src/lib/utils');

describe('#actions/geek-lab/config', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should show cli config when no params are provided', () => {
    const readConfigStub = sinon.stub().returns({
      'env': null,
      'reason': 'mocked by rprado on unit test',
    });
    sinon.replace(utils, 'readConfig', readConfigStub);

    configAction.builder(yargs);
    const res = configAction.handler({});
    assert.ok((res).includes('mocked by rprado on unit test'));
  });

  it('should create a new env config given a an env a key and a value', (done) => {
    const value = uuidv1();
    const key = `myCustomKey-${value}`;
    const env = `env-${value}`;

    const readConfigStub = sinon.stub().returns({
      'env': null,
    });

    sinon.replace(utils, 'readConfig', readConfigStub);

    const writeInternalCliFileStub = sinon.stub().returns();
    sinon.replace(utils, 'writeInternalCliFile', writeInternalCliFileStub);

    configAction.handler({
      env: env,
      key: key,
      value: value,
    });

    const stubCalledParams = writeInternalCliFileStub.getCall(0).args[1];

    const expectedParams = {
      env: null,
    };
    expectedParams[env] = {};
    expectedParams[env][key] = value;

    assert.strictEqual(readConfigStub.calledOnce, true);
    assert.strictEqual(writeInternalCliFileStub.calledOnce, true);

    assert.deepStrictEqual(stubCalledParams, expectedParams);
    done();
  });

  it('should change existing by editing its config given a an env a key and a value', (done) => {
    const value = uuidv1();
    const readConfigStub = sinon.stub().returns({
      'env': null,
      'batman': {
        'birthCity': 'Gotham',
      },
    });

    sinon.replace(utils, 'readConfig', readConfigStub);

    const writeInternalCliFileStub = sinon.stub().returns();
    sinon.replace(utils, 'writeInternalCliFile', writeInternalCliFileStub);

    configAction.handler({
      env: 'batman',
      key: 'birthCity',
      value: value,
    });

    const stubCalledParams = writeInternalCliFileStub.getCall(0).args[1];

    const expectedParams = {
      env: null,
      batman: {
        'birthCity': value,
      },
    };

    assert.strictEqual(readConfigStub.calledOnce, true);
    assert.strictEqual(writeInternalCliFileStub.calledOnce, true);

    assert.deepStrictEqual(stubCalledParams, expectedParams);
    done();
  });
});