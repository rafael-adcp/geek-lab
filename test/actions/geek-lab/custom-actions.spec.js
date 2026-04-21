const action = require('../../../src/actions/geek-lab/custom-actions');
const utils = require('../../../src/lib/utils');
const assert = require('node:assert/strict');

const yargs = require('yargs');
const sinon = require('sinon');

describe('#actions/geek-lab/custom-actions', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('should print default actions', (done) => {
    const readConfigStub = sinon.stub().returns([
      'rprado',
    ]);

    sinon.replace(utils, 'getActionsFromPath', readConfigStub);
    action.builder(yargs);
    const res = action.handler();
    assert.ok((res).includes('rprado'));
    done();
  });
});