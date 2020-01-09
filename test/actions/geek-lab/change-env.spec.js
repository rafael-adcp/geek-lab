const execSync = require('child_process').execSync;
const expect = require('expect');
const uuidv1 = require('uuid/v1');

const {
  readConfig,
  writeInternalCliFile,
} = require('../../../src/lib/utils');

const execBin = require('../../helper');
const originalConfig = readConfig();
describe('#actions/geek-lab/change-env', () => {
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

  [
    {
      command: `${execBin} change-env`,
      errorMessage: 'Parameter env cant be empty',
      testName: 'should throw error if env isnt provided',
    },
    {
      command: `${execBin} change-env --env ${uuidv1()}`,
      errorMessage: 'Environment dont exist on cli configuration',
      testName: 'should throw an error if env isnt available on cli config',
    },
  ].forEach((element) => {
    it(element.testName, (done) => {
      try {
        execSync(element.command);
        done('this shouldnt hapen');
      } catch (e) {
        expect(e.toString()).toContain(element.errorMessage);
        done();
      }
    });
  });

  it('should change cli env', (done) => {
    const value = uuidv1();
    const key = `myCustomKey-${value}`;
    const env = `env-${value}`;

    //creating a new env config
    execSync(`${execBin} config --env ${env} --key ${key} --value ${value}`);
    let res = execSync(`${execBin} config`).toString();
    expect(res).toContain(env);
    expect(res).toContain(key);
    expect(res).toContain(value);

    //moving cli to this env
    execSync(`${execBin} change-env --env ${env}`);

    //grabbing config
    res = execSync(`${execBin} config`).toString();

    //verifying cli is pointing to it
    expect(res).toContain(`"env": "${env}"`);
    done();
  });
});