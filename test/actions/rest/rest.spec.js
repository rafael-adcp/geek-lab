const execSync = require('child_process').execSync;
const expect = require('expect');
//TODO add a test for each ? mocking sinon to ensure things are provided to axios
[
  'cget',
  'cdelete',
].forEach((restAction) => {
  describe(`#actions/geek-lab/rest/rest::${restAction}`, () => {
    it(`${restAction}:: should throw error if no endpoint is provided`, (done) => {
      try {
        execSync(`geek-lab ${restAction}`).toString();
        done('this shouldnt happen');
      } catch (e) {
        expect(e.toString()).toContain('Parameter --endpoint cant be empty');
        done();
      }
    });
  });
});

[
  'cpost',
  'cput',
].forEach((restAction) => {
  describe(`#actions/geek-lab/rest/rest::${restAction}`, () => {
    //TODO: turn this into an array and dynamically generate them since its all the same
    it(`${restAction}:: should throw error if no --jsonFile is provided`, (done) => {
      try {
        execSync(`geek-lab ${restAction}`).toString();
        done('this shouldnt happen');
      } catch (e) {
        expect(e.toString()).toContain('Parameter --endpoint and --jsonFile cant be empty');
        done();
      }
    });

    it(`${restAction}:: should throw error if no --endpoint is provided`, (done) => {
      try {
        execSync(`geek-lab ${restAction}`).toString();
        done('this shouldnt happen');
      } catch (e) {
        expect(e.toString()).toContain('Parameter --endpoint and --jsonFile cant be empty');
        done();
      }
    });

    it(`${restAction}:: should throw error if no --jsonFile is provided`, (done) => {
      try {
        execSync(`geek-lab ${restAction} --endpoint blah`).toString();
        done('this shouldnt happen');
      } catch (e) {
        expect(e.toString()).toContain('Parameter --endpoint and --jsonFile cant be empty');
        done();
      }
    });
  });
});