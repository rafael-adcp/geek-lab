const assert = require('node:assert/strict');
const { createCliEnv, startHttpServer } = require('../helpers/e2e');

describe('#e2e/rest', () => {
  let env;
  let server;

  afterEach(async () => {
    env?.cleanup();
    env = null;
    if (server) {
      await server.close();
      server = null;
    }
  });

  function setup(handler, configOverrides = {}) {
    return startHttpServer(handler).then((s) => {
      server = s;
      env = createCliEnv({
        config: {
          env: 'dev',
          token: 'tok-abc',
          dev: { apiUrl: server.url, ...configOverrides },
        },
      });
      return server;
    });
  }

  it('cget hits the configured endpoint with the cached token and prints the response body', async () => {
    let captured;
    await setup((req, res) => {
      captured = { method: req.method, url: req.url, auth: req.headers.authorization };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, who: 'cget' }));
    });

    const { stdout, status } = await env.run(['cget', '--endpoint', 'things']);

    assert.strictEqual(status, 0);
    assert.deepStrictEqual(captured, { method: 'GET', url: '/things', auth: 'tok-abc' });
    assert.deepStrictEqual(JSON.parse(stdout), { ok: true, who: 'cget' });
  });

  it('cpost sends the --json payload as the request body', async () => {
    let captured;
    await setup((req, res, body) => {
      captured = { method: req.method, url: req.url, body, contentType: req.headers['content-type'] };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ created: 42 }));
    });

    const payload = JSON.stringify({ name: 'thing', count: 3 });
    const { stdout, status } = await env.run(['cpost', '--endpoint', '/things', '--json', payload]);

    assert.strictEqual(status, 0);
    assert.strictEqual(captured.method, 'POST');
    assert.strictEqual(captured.url, '/things');
    assert.strictEqual(captured.body, payload);
    assert.strictEqual(captured.contentType, 'application/json');
    assert.deepStrictEqual(JSON.parse(stdout), { created: 42 });
  });

  it('cput sends the --json payload as the request body', async () => {
    let captured;
    await setup((req, res, body) => {
      captured = { method: req.method, url: req.url, body };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ updated: true }));
    });

    const payload = JSON.stringify({ count: 9 });
    const { stdout, status } = await env.run(['cput', '--endpoint', '/things/1', '--json', payload]);

    assert.strictEqual(status, 0);
    assert.strictEqual(captured.method, 'PUT');
    assert.strictEqual(captured.url, '/things/1');
    assert.strictEqual(captured.body, payload);
    assert.deepStrictEqual(JSON.parse(stdout), { updated: true });
  });

  it('cdelete issues a DELETE against the configured endpoint', async () => {
    let captured;
    await setup((req, res) => {
      captured = { method: req.method, url: req.url };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ deleted: true }));
    });

    const { stdout, status } = await env.run(['cdelete', '--endpoint', '/things/1']);

    assert.strictEqual(status, 0);
    assert.deepStrictEqual(captured, { method: 'DELETE', url: '/things/1' });
    assert.deepStrictEqual(JSON.parse(stdout), { deleted: true });
  });

  it('exits non-zero and surfaces the upstream error when the API responds with 5xx', async () => {
    await setup((req, res) => {
      res.statusCode = 500;
      res.end('boom');
    });

    const { status, stdout, stderr } = await env.run(['cget', '--endpoint', '/broken']);

    assert.notStrictEqual(status, 0);
    assert.ok(
      (stdout + stderr).length > 0,
      'expected the CLI to print something on a 5xx upstream'
    );
  });

  it('fails with a helpful error when --endpoint is omitted', async () => {
    env = createCliEnv();

    const { status, stderr } = await env.run(['cget']);

    assert.notStrictEqual(status, 0);
    assert.ok(stderr.includes('--endpoint'));
  });
});
