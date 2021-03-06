const action = require('../../../src/actions/geek-lab/default-actions');
const utils = require('../../../src/lib/utils');
const expect = require('expect');

const yargs = require('yargs');
const sinon = require('sinon');

describe('#actions/geek-lab/default-actions', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('should print default actions', (done) => {
    const readConfigStub = sinon.stub().returns([
      'batman',
      'foo',
    ]);

    sinon.replace(utils, 'getActionsFromPath', readConfigStub);
    action.builder(yargs);
    const res = action.handler();
    expect(res).toContain('batman');
    done();
  });
});