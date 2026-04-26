import assert from 'node:assert/strict';
import { createCliEnv, withHttpServer } from '../helpers/e2e.js';

describe('#e2e/rest — cget', () => {
  let env;
  let captured;
  let runResult;

  before(async () => {
    const r = await withHttpServer({
      handler: (req, res) => {
        captured = { method: req.method, url: req.url, auth: req.headers.authorization };
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, who: 'cget' }));
      },
      config: { token: 'tok-abc' },
    });
    env = r.env;
    runResult = await env.run(['cget', '--endpoint', 'things']);
  });

  after(async () => { await env.cleanup(); });

  it('exits zero', () => {
    assert.strictEqual(runResult.status, 0);
  });

  it('issues a GET against the normalized endpoint with the cached token', () => {
    assert.deepStrictEqual(captured, { method: 'GET', url: '/things', auth: 'tok-abc' });
  });

  it('prints the response body as JSON on stdout', () => {
    assert.deepStrictEqual(JSON.parse(runResult.stdout), { ok: true, who: 'cget' });
  });
});

describe('#e2e/rest — cpost', () => {
  let env;
  let captured;
  let runResult;
  const payload = JSON.stringify({ name: 'thing', count: 3 });

  before(async () => {
    const r = await withHttpServer({
      handler: (req, res, body) => {
        captured = { method: req.method, url: req.url, body, contentType: req.headers['content-type'] };
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ created: 42 }));
      },
      config: { token: 'tok-abc' },
    });
    env = r.env;
    runResult = await env.run(['cpost', '--endpoint', '/things', '--json', payload]);
  });

  after(async () => { await env.cleanup(); });

  it('exits zero', () => {
    assert.strictEqual(runResult.status, 0);
  });

  it('uses POST', () => {
    assert.strictEqual(captured.method, 'POST');
  });

  it('hits the requested endpoint', () => {
    assert.strictEqual(captured.url, '/things');
  });

  it('sends the --json payload verbatim as the request body', () => {
    assert.strictEqual(captured.body, payload);
  });

  it('sets Content-Type: application/json', () => {
    assert.strictEqual(captured.contentType, 'application/json');
  });

  it('prints the response body as JSON on stdout', () => {
    assert.deepStrictEqual(JSON.parse(runResult.stdout), { created: 42 });
  });
});

describe('#e2e/rest — cput', () => {
  let env;
  let captured;
  let runResult;
  const payload = JSON.stringify({ count: 9 });

  before(async () => {
    const r = await withHttpServer({
      handler: (req, res, body) => {
        captured = { method: req.method, url: req.url, body };
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ updated: true }));
      },
      config: { token: 'tok-abc' },
    });
    env = r.env;
    runResult = await env.run(['cput', '--endpoint', '/things/1', '--json', payload]);
  });

  after(async () => { await env.cleanup(); });

  it('exits zero', () => {
    assert.strictEqual(runResult.status, 0);
  });

  it('uses PUT against the requested endpoint', () => {
    assert.strictEqual(captured.method, 'PUT');
    assert.strictEqual(captured.url, '/things/1');
  });

  it('sends the --json payload verbatim as the request body', () => {
    assert.strictEqual(captured.body, payload);
  });

  it('prints the response body as JSON on stdout', () => {
    assert.deepStrictEqual(JSON.parse(runResult.stdout), { updated: true });
  });
});

describe('#e2e/rest — cdelete', () => {
  let env;
  let captured;
  let runResult;

  before(async () => {
    const r = await withHttpServer({
      handler: (req, res) => {
        captured = { method: req.method, url: req.url };
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ deleted: true }));
      },
      config: { token: 'tok-abc' },
    });
    env = r.env;
    runResult = await env.run(['cdelete', '--endpoint', '/things/1']);
  });

  after(async () => { await env.cleanup(); });

  it('exits zero', () => {
    assert.strictEqual(runResult.status, 0);
  });

  it('issues a DELETE against the requested endpoint', () => {
    assert.deepStrictEqual(captured, { method: 'DELETE', url: '/things/1' });
  });

  it('prints the response body as JSON on stdout', () => {
    assert.deepStrictEqual(JSON.parse(runResult.stdout), { deleted: true });
  });
});

describe('#e2e/rest — upstream 5xx', () => {
  let env;
  let runResult;

  before(async () => {
    const r = await withHttpServer({
      handler: (req, res) => { res.statusCode = 500; res.end('boom'); },
      config: { token: 'tok-abc' },
    });
    env = r.env;
    runResult = await env.run(['cget', '--endpoint', '/broken']);
  });

  after(async () => { await env.cleanup(); });

  it('exits non-zero', () => {
    assert.notStrictEqual(runResult.status, 0);
  });

  it('prints something to the user (does not exit silently)', () => {
    assert.ok(
      (runResult.stdout + runResult.stderr).length > 0,
      'expected the CLI to print something on a 5xx upstream'
    );
  });
});

describe('#e2e/rest — missing --endpoint', () => {
  let env;
  let runResult;

  before(async () => {
    env = createCliEnv();
    runResult = await env.run(['cget']);
  });

  after(async () => { await env.cleanup(); });

  it('exits non-zero', () => {
    assert.notStrictEqual(runResult.status, 0);
  });

  it('mentions the missing flag in stderr', () => {
    assert.ok(runResult.stderr.includes('--endpoint'));
  });
});
