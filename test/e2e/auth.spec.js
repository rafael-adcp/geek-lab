const assert = require('node:assert/strict');
const { createCliEnv, startHttpServer } = require('../helpers/e2e');

describe('#e2e/auth', () => {
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

  it('reuses a non-expired cached token and skips the API call', async () => {
    let hits = 0;
    server = await startHttpServer((req, res) => {
      hits += 1;
      res.statusCode = 500;
      res.end('should not be called');
    });

    env = createCliEnv({
      config: {
        env: 'dev',
        token: 'cached-token-xyz',
        tokenExpires: '2099-01-01T00:00:00.000Z',
        dev: { apiUrl: server.url },
      },
    });

    const { stdout, status } = await env.run(['auth']);

    assert.strictEqual(status, 0);
    assert.ok(stdout.includes('cached-token-xyz'));
    assert.strictEqual(hits, 0);
  });

  it('requests a new token when none is cached and persists it to config', async () => {
    let captured;
    server = await startHttpServer((req, res, body) => {
      captured = { method: req.method, url: req.url, body };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ response: { status: 'OK', token: 'freshly-issued' } }));
    });

    env = createCliEnv({
      config: {
        env: 'dev',
        token: null,
        tokenExpires: null,
        dev: {
          apiUrl: server.url,
          apiAuthenticationEndpoint: '/auth',
          apiTokenResponseField: 'token',
          apiAuthenticationExpiresInMinutes: 120,
          apiAuthenticationJson: JSON.stringify({ auth: { username: 'u', password: 'p' } }),
        },
      },
    });

    const { stdout, status } = await env.run(['auth']);

    assert.strictEqual(status, 0);
    assert.ok(stdout.includes('freshly-issued'));
    assert.deepStrictEqual(captured, {
      method: 'POST',
      url: '/auth',
      body: JSON.stringify({ auth: { username: 'u', password: 'p' } }),
    });

    const config = env.readConfig();
    assert.strictEqual(config.token, 'freshly-issued');
    assert.ok(new Date(config.tokenExpires) > new Date());
  });

  it('fails when the API responds without the expected shape', async () => {
    server = await startHttpServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ response: { status: 'ERROR' } }));
    });

    env = createCliEnv({
      config: {
        env: 'dev',
        token: null,
        tokenExpires: null,
        dev: {
          apiUrl: server.url,
          apiAuthenticationEndpoint: '/auth',
          apiTokenResponseField: 'token',
          apiAuthenticationExpiresInMinutes: 120,
          apiAuthenticationJson: JSON.stringify({ auth: { username: 'u', password: 'p' } }),
        },
      },
    });

    const { status, stdout, stderr } = await env.run(['auth']);

    assert.notStrictEqual(status, 0);
    assert.ok((stdout + stderr).includes('Something wrong happend on authentication'));
  });
});
