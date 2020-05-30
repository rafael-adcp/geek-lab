const expect = require('expect');
const yargs = require('yargs');
const sinon = require('sinon');

const actions = require('../../../src/actions/mysql/mysql-find-table');
const utils = require('../../../src/lib/utils');

describe('#actions/mysql-find-table', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('should execute a mysql command given', (done) => {
    const stub = sinon.stub().returns({ rows: []});

    sinon.replace(utils, 'performMySQLQuery', stub);
    const table = 'superheroes';
    actions.builder(yargs);
    actions.handler({
      table: table,
    }).then(() => {
      const stubCalledParams = stub.getCall(0);
      expect(stubCalledParams.toString()).toContain(table);
      done();
    });
  });

  it('should handle errors properly and show query + exception', (done) => {
    const exceptionMessage = 'monkeys forced it to fail';
    const stub = sinon.stub().throws(exceptionMessage);

    sinon.replace(utils, 'performMySQLQuery', stub);
    const table = 'superheroes';
    actions.builder(yargs);
    actions.handler({
      table: table,
    }).catch((e) => {
      expect(e.toString()).toContain(table);
      expect(e.toString()).toContain(exceptionMessage);
      done();
    });
  });
});