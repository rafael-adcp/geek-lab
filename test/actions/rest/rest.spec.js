const expect = require('expect');
const sinon = require('sinon');
const yargs = require('yargs');
const cget = require('../../../src/actions/rest/cget');
const cdelete = require('../../../src/actions/rest/cdelete');

const cpost = require('../../../src/actions/rest/cpost');
const cput = require('../../../src/actions/rest/cput');

const utils = require('../../../src/lib/utils');

[
  cget,
  cdelete,
].forEach((restAction) => {
  describe(`#actions/geek-lab/rest/rest::${restAction.command}`, () => {

    afterEach(() => {
      sinon.restore();
    });

    it(`${restAction.command}:: should call performRequest`, (done) => {

      const performRequestStub = sinon.stub().resolves({});

      sinon.replace(utils, 'performRequest', performRequestStub);
      restAction.builder(yargs);
      restAction.handler({ endpoint: '/batman' }).then(() => {
        const stubCalledParams = performRequestStub.getCall(0).args[0];
        expect(performRequestStub.calledOnce).toBe(true);
        expect(stubCalledParams).toStrictEqual({
          'endpoint': '/batman',
          'method': restAction.restAction,
        });
        done();
      });
    });
  });
});

[
  cpost,
  cput,
].forEach((restAction) => {
  describe(`#actions/geek-lab/rest/rest::${restAction.command}`, () => {
    afterEach(() => {
      sinon.restore();
    });

    it(`${restAction.command}:: should call performRequest`, (done) => {

      const performRequestStub = sinon.stub().resolves({});

      sinon.replace(utils, 'performRequest', performRequestStub);
      restAction.builder(yargs);
      restAction.handler({
        endpoint: '/batman',
        json: {
          heroName: 'Batman',
          realName: 'Bruce',
        },
      })
        .then(() => {
          const stubCalledParams = performRequestStub.getCall(0).args[0];
          expect(performRequestStub.calledOnce).toBe(true);
          expect(stubCalledParams).toStrictEqual({
            'endpoint': '/batman',
            'method': restAction.restAction,
            'data': {
              heroName: 'Batman',
              realName: 'Bruce',
            },
          });
          done();
        });
    });
  });
});