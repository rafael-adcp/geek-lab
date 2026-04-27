import assert from 'node:assert/strict';
import { withHttpServer } from '../helpers/e2e.js';

const AUTH_ENDPOINT_CONFIG = {
  apiAuthenticationEndpoint: '/auth',
  apiTokenResponseField: 'token',
  apiAuthenticationExpiresInMinutes: 120,
  apiAuthenticationJson: JSON.stringify({ auth: { username: 'u', password: 'p' } }),
};

describe('#e2e/workflow — auth then cget reuses the persisted token', () => {
  let env;
  let authHits;
  let cgetCapture;
  let authResult;
  let cgetResult;

  before(async () => {
    authHits = 0;
    const r = await withHttpServer({
      handler: (req, res, body) => {
        if (req.url === '/auth' && req.method === 'POST') {
          authHits += 1;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ response: { status: 'OK', token: 'workflow-token-123' } }));
          return;
        }
        cgetCapture = { method: req.method, url: req.url, auth: req.headers.authorization, body };
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      },
      config: { token: null, tokenExpires: null },
      configOverrides: AUTH_ENDPOINT_CONFIG,
    });
    env = r.env;
    authResult = await env.run(['auth']);
    cgetResult = await env.run(['cget', '--endpoint', '/things']);
  });

  after(async () => { await env.cleanup(); });

  it('auth exits zero', () => {
    assert.strictEqual(authResult.status, 0);
  });

  it('cget exits zero', () => {
    assert.strictEqual(cgetResult.status, 0);
  });

  it('hits /auth exactly once across both invocations', () => {
    assert.strictEqual(authHits, 1);
  });

  it('persists the issued token to config so cget can reuse it', () => {
    assert.strictEqual(env.readConfig().token, 'workflow-token-123');
  });

  it('forwards the cached token as the Authorization header on cget', () => {
    assert.strictEqual(cgetCapture.auth, 'workflow-token-123');
  });

  it('issues the GET against the requested endpoint', () => {
    assert.strictEqual(cgetCapture.method, 'GET');
    assert.strictEqual(cgetCapture.url, '/things');
  });
});
