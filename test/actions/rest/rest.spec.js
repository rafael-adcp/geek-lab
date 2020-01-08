const execSync = require('child_process').execSync;
const expect = require('expect');
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
    [
      {
        testName: `${restAction}:: should throw error if no --json is provided`,
        command: `geek-lab ${restAction}`,
        errorMessage: 'Parameter --endpoint and --json cant be empty',
      },

      {
        testName: `${restAction}:: should throw error if no --endpoint is provided`,
        command: `geek-lab ${restAction}`,
        errorMessage: 'Parameter --endpoint and --json cant be empty',
      },

      {
        testName: `${restAction}:: should throw error if no --json is provided`,
        command: `geek-lab ${restAction} --endpoint blah`,
        errorMessage: 'Parameter --endpoint and --json cant be empty',
      },
    ].forEach((element) => {
      it(element.testName, (done) => {
        try {
          execSync(element.command).toString();
          done('this shouldnt happen');
        } catch (e) {
          expect(e.toString()).toContain(element.errorMessage);
          done();
        }
      });
    });
  });
});