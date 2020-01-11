
const expect = require('expect');
const sinon = require('sinon');

const {
  getActions,
} = require('../../src/lib/utils');

const utils = require('../../src/lib/utils');

describe('#src/lib/utils/lib/getActions', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('shoul handle when customActionsPath is empty', () => {
    const readConfigtub = sinon.stub().returns({
      customActionsPath: [],
    });
    sinon.replace(utils, 'readConfig', readConfigtub);
    const actions = getActions();
    expect(actions).not.toBe(null);
  });

  it('shoul throw an error if a duplication action command if found', (done) => {
    const lodash = require('lodash');
    const filterStub = sinon.stub().returns(
      [1, 2, 3]
    );

    sinon.replace(lodash, 'filter', filterStub);

    const findStub = sinon.stub().returns(
      {
        path: 'mocked on unit tests',
      }
    );
    sinon.replace(lodash, 'find', findStub);

    try {
      getActions();
      done('nop');
    } catch (e) {
      expect(e.toString()).toBe('Error: Duplicate command provided');
      done();
    }
  });
});