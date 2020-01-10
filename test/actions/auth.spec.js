const execSync = require('child_process').execSync;
const expect = require('expect');
const uuidv1 = require('uuid/v1');
const moment = require('moment');

const {
  readConfig,
  writeInternalCliFile,
} = require('../../src/lib/utils');

const execBin = require('../helper');

const originalConfig = readConfig();
describe('#actions/auth', () => {
  //TODO: mock this somehow
  before(() => {
    console.log('making a backup of config file before tests mess with it');
    writeInternalCliFile(
      'bkp_config_geek-lab.json',
      originalConfig
    );
  });

  after(() => {
    console.log('restoring config file');
    writeInternalCliFile(
      'config_geek-lab.json',
      originalConfig
    );
  });

  it('should just print the token if a token is set and it is not expired', () => {
    const config = readConfig();
    config.token = `faking me for test - ${uuidv1()}`;
    //setting token to expire within next 2 hours
    config.tokenExpires = moment().add(120, 'minutes');

    //placing the config
    writeInternalCliFile(
      'config_geek-lab.json',
      config
    );

    const res = execSync(`${execBin} auth`).toString();
    expect(res).toContain(config.token);
  });

  it('should throw an error if fails to call api', (done) => {
    const config = readConfig();
    config.token = null; // forcing it to create a new one
    config.env = 'unitTests';
    config.unitTests = {
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
    };

    //placing the config
    writeInternalCliFile(
      'config_geek-lab.json',
      config
    );

    try {
      execSync(`${execBin} auth`);
      done('this should not happen');
    } catch (e) {
      expect(e.toString()).toContain('Failed to execute api call');
      done();
    }
  });

  it('should throw an error if api response is not on the expected shape', (done) => {
    const config = readConfig();
    config.token = null; // forcing it to create a new one
    config.tokenExpires = null; // forcing it to be filled
    config.env = 'unitTests';
    config.unitTests = {
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
    };

    //placing the config
    writeInternalCliFile(
      'config_geek-lab.json',
      config
    );

    try {
      execSync(`${execBin} auth`);
      done('this should not happen');
    } catch (e) {
      expect(e.toString()).toContain('Something wrong happend on authentication');
      done();
    }
  });
});