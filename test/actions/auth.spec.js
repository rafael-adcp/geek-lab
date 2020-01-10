const expect = require('expect');
const uuidv1 = require('uuid/v1');
const moment = require('moment');
const yargs = require('yargs');
const sinon = require('sinon');

const authAction = require('../../src/actions/auth');
const utils = require('../../src/lib/utils');

describe('#actions/auth', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('should just print the token if a token is set and it is not expired', (done) => {
    const token = `faking me for test - ${uuidv1()}`;
    const tokenExpires = moment().add(120, 'minutes');

    const readConfigStub = sinon.stub().returns({
      'env': null,
      'token': token,
      'tokenExpires': tokenExpires,
    });

    sinon.replace(utils, 'readConfig', readConfigStub);
    authAction.builder(yargs);
    authAction.handler().then((res) => {
      expect(res).toContain(token);
      done();
    });
  });

  it('should throw an error if fails to call api', (done) => {
    const readConfigStub = sinon.stub().returns({
      token: null, // forcing it to create a new one
      env: 'unitTests',
      unitTests: {
        'apiUrl': 'my_url_here',
        'apiAuthenticationExpiresInMinutes': 120,
        'apiAuthenticationEndpoint': 'aaa',
        'apiTokenResponseField': 'bbb',
        'apiAuthenticationJson': {
          auth: {
            username: 'aaa',
            password: 'bbb',
          },
        },
      },
    });

    sinon.replace(utils, 'readConfig', readConfigStub);

    authAction.handler().catch((e) => {
      expect(e.toString()).toContain('Failed to execute api call');
      done();
    });
  });

  it('should throw an error if api response is not with the expected shape', (done) => {
    const readConfigStub = sinon.stub().returns({
      token: null, // forcing it to create a new one
      tokenExpires: null, // forcing it to be filled
      env: 'unitTests',
      unitTests: {
        'apiUrl': 'https://httpstatuses.com',
        'apiAuthenticationExpiresInMinutes': 120,
        'apiAuthenticationEndpoint': '/200',
        'apiTokenResponseField': 'bbb',
        'apiAuthenticationJson': {
          auth: {
            username: 'aaa',
            password: 'bbb',
          },
        },
      },
    });

    sinon.replace(utils, 'readConfig', readConfigStub);

    authAction.handler().catch((e) => {
      expect(e.toString()).toContain('Something wrong happend on authentication');
      done();
    });
  });

  it('should save token and token expires when authentication call works', (done) => {
    const readConfigStub = sinon.stub().returns({
      token: null, // forcing it to create a new one
      tokenExpires: null, // forcing it to be filled
      env: 'unitTests',
      'unitTests': {
        'apiUrl': 'https://httpstatuses.com',
        'apiAuthenticationExpiresInMinutes': 120,
        'apiAuthenticationEndpoint': '/200',
        'apiTokenResponseField': 'token',
        'apiAuthenticationJson': {
          auth: {
            username: 'aaa',
            password: 'bbb',
          },
        },
      },
    });

    sinon.replace(utils, 'readConfig', readConfigStub);

    const performRequestStub = sinon.stub().resolves({
      response: {
        status: 'OK',
        token: 'batman-1234',
      },
    });

    sinon.replace(utils, 'performRequest', performRequestStub);

    const writeInternalCliFileStub = sinon.stub().returns();
    sinon.replace(utils, 'writeInternalCliFile', writeInternalCliFileStub);

    authAction.handler().then(() => {
      const stubCalledParams = writeInternalCliFileStub.getCall(0);
      expect(stubCalledParams.toString()).toContain('batman-1234');
      done();
    });
  });
});