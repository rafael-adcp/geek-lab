const assert = require('node:assert/strict');
const yargs = require('yargs');
const sinon = require('sinon');

const mysqlAction = require('../../../src/actions/mysql/mysql');
const utils = require('../../../src/lib/utils');

describe('#actions/mysql', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('should execute a mysql command given', (done) => {
    const stub = sinon.stub().returns({ rows: []});

    sinon.replace(utils, 'performMySQLQuery', stub);
    const query = 'select * from universe where is_superhero = true';
    mysqlAction.builder(yargs);
    mysqlAction.handler({
      query: query,
    }).then(() => {
      const stubCalledParams = stub.getCall(0);
      assert.ok((stubCalledParams.toString()).includes(query));
      done();
    });
  });

  it('should handle errors properly and show query + exception', (done) => {
    const exceptionMessage = 'monkeys forced it to fail';
    const stub = sinon.stub().throws(exceptionMessage);

    sinon.replace(utils, 'performMySQLQuery', stub);
    const query = 'select * from universe where is_superhero = true';
    mysqlAction.builder(yargs);
    mysqlAction.handler({
      query: query,
    }).catch((e) => {
      assert.ok((e.toString()).includes(query));
      assert.ok((e.toString()).includes(exceptionMessage));
      done();
    });
  });
});