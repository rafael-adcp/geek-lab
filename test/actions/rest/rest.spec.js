import assert from 'node:assert/strict';
import sinon from 'sinon';
import yargs from 'yargs';

import cgetFactory from '../../../src/actions/rest/cget.js';
import cdeleteFactory from '../../../src/actions/rest/cdelete.js';
import cpostFactory from '../../../src/actions/rest/cpost.js';
import cputFactory from '../../../src/actions/rest/cput.js';

const cases = [
  { factory: cgetFactory, command: 'cget', method: 'GET', hasBody: false },
  { factory: cdeleteFactory, command: 'cdelete', method: 'DELETE', hasBody: false },
  { factory: cpostFactory, command: 'cpost', method: 'POST', hasBody: true },
  { factory: cputFactory, command: 'cput', method: 'PUT', hasBody: true },
];

describe('#actions/rest', () => {
  cases.forEach(({ factory, command, method, hasBody }) => {
    describe(`#${command}`, () => {
      it(`forwards method=${method} and the user's --endpoint to http.request`, async () => {
        const request = sinon.stub().resolves({ ok: true });
        const action = factory({ http: { request } });
        action.builder(yargs());

        const argv = { endpoint: '/things' };
        if (hasBody) argv.json = '{"x":1}';

        await action.handler(argv);

        assert.strictEqual(action.command, command);
        assert.strictEqual(request.calledOnce, true);
        const passed = request.getCall(0).args[0];
        assert.strictEqual(passed.method, method);
        assert.strictEqual(passed.endpoint, '/things');
        if (hasBody) {
          assert.strictEqual(passed.data, '{"x":1}');
        } else {
          assert.strictEqual(passed.data, undefined);
        }
      });
    });
  });
});
