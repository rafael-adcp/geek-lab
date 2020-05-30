const expect = require('expect');
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
      expect(stubCalledParams.toString()).toContain(column);
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
      expect(e.toString()).toContain(column);
      expect(e.toString()).toContain(exceptionMessage);
      done();
    });
  });
});