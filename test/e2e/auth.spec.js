import assert from 'node:assert/strict';
import { withHttpServer } from '../helpers/e2e.js';

const AUTH_ENDPOINT_CONFIG = {
  apiAuthenticationEndpoint: '/auth',
  apiTokenResponseField: 'token',
  apiAuthenticationExpiresInMinutes: 120,
  apiAuthenticationJson: JSON.stringify({ auth: { username: 'u', password: 'p' } }),
};

describe('#e2e/auth — cached non-expired token', () => {
  let env;
  let hits;
  let runResult;

  before(async () => {
    hits = 0;
    const r = await withHttpServer({
      handler: (req, res) => { hits += 1; res.statusCode = 500; res.end('should not be called'); },
      config: {
        token: 'cached-token-xyz',
        tokenExpires: '2099-01-01T00:00:00.000Z',
      },
    });
    env = r.env;
    runResult = await env.run(['auth']);
  });

  after(async () => { await env.cleanup(); });

  it('exits zero', () => {
    assert.strictEqual(runResult.status, 0);
  });

  it('prints the cached token', () => {
    assert.ok(runResult.stdout.includes('cached-token-xyz'));
  });

  it('does not hit the auth endpoint', () => {
    assert.strictEqual(hits, 0);
  });
});

describe('#e2e/auth — requests new token when none cached', () => {
  let env;
  let captured;
  let runResult;
  let testStartTime;

  before(async () => {
    testStartTime = new Date();
    const r = await withHttpServer({
      handler: (req, res, body) => {
        captured = { method: req.method, url: req.url, body };
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ response: { status: 'OK', token: 'freshly-issued' } }));
      },
      config: { token: null, tokenExpires: null },
      configOverrides: AUTH_ENDPOINT_CONFIG,
    });
    env = r.env;
    runResult = await env.run(['auth']);
  });

  after(async () => { await env.cleanup(); });

  it('exits zero', () => {
    assert.strictEqual(runResult.status, 0);
  });

  it('prints the freshly-issued token', () => {
    assert.ok(runResult.stdout.includes('freshly-issued'));
  });

  it('POSTs to the configured auth endpoint with the configured body', () => {
    assert.deepStrictEqual(captured, {
      method: 'POST',
      url: '/auth',
      body: JSON.stringify({ auth: { username: 'u', password: 'p' } }),
    });
  });

  it('persists the new token to config', () => {
    assert.strictEqual(env.readConfig().token, 'freshly-issued');
  });

  it('persists a tokenExpires in the future', () => {
    const expires = new Date(env.readConfig().tokenExpires);
    assert.ok(expires > testStartTime, `expected ${expires.toISOString()} > ${testStartTime.toISOString()}`);
  });
});

describe('#e2e/auth — auth endpoint unreachable', () => {
  let env;
  let runResult;

  before(async () => {
    const r = await withHttpServer({
      handler: (req, res) => { res.statusCode = 200; res.end('{}'); },
      config: { token: null, tokenExpires: null },
      configOverrides: AUTH_ENDPOINT_CONFIG,
    });
    env = r.env;
    // close the server but keep the now-unreachable URL in config
    await r.server.close();
    runResult = await env.run(['auth']);
  });

  after(async () => { await env.cleanup(); });

  it('exits non-zero', () => {
    assert.notStrictEqual(runResult.status, 0);
  });

  it('surfaces "Failed to execute api call" in the output', () => {
    assert.ok((runResult.stdout + runResult.stderr).includes('Failed to execute api call'));
  });
});

describe('#e2e/auth — API responds with bad shape', () => {
  let env;
  let runResult;

  before(async () => {
    const r = await withHttpServer({
      handler: (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ response: { status: 'ERROR' } }));
      },
      config: { token: null, tokenExpires: null },
      configOverrides: AUTH_ENDPOINT_CONFIG,
    });
    env = r.env;
    runResult = await env.run(['auth']);
  });

  after(async () => { await env.cleanup(); });

  it('exits non-zero', () => {
    assert.notStrictEqual(runResult.status, 0);
  });

  it('surfaces "Something wrong happened on authentication" in the output', () => {
    assert.ok((runResult.stdout + runResult.stderr).includes('Something wrong happened on authentication'));
  });
});

