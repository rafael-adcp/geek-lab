const assert = require('node:assert/strict');
const yargs = require('yargs');
const sinon = require('sinon');

const actions = require('../../../src/actions/mysql/mysql-find-column');
const utils = require('../../../src/lib/utils');

describe('#actions/mysql-find-column', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('should execute a mysql command given', (done) => {
    const stub = sinon.stub().returns({ rows: []});

    sinon.replace(utils, 'performMySQLQuery', stub);
    const column = 'is_superhero';
    actions.builder(yargs);
    actions.handler({
      column: column,
    }).then(() => {
      const stubCalledParams = stub.getCall(0);
      assert.ok((stubCalledParams.toString()).includes(column));
      done();
    });
  });

  it('should handle errors properly and show query + exception', (done) => {
    const exceptionMessage = 'monkeys forced it to fail';
    const stub = sinon.stub().throws(exceptionMessage);

    sinon.replace(utils, 'performMySQLQuery', stub);
    const column = 'is_superhero';
    actions.builder(yargs);
    actions.handler({
      column: column,
    }).catch((e) => {
      assert.ok((e.toString()).includes(column));
      assert.ok((e.toString()).includes(exceptionMessage));
      done();
    });
  });
});