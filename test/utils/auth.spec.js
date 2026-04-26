import assert from 'node:assert/strict';
import {
  isTokenValid,
  parseAuthResponse,
  computeTokenExpires,
  resolveAuthBody,
  fetchToken,
} from '../../src/utils/auth/index.js';

describe('#utils/auth/isTokenValid', () => {
  const now = new Date('2026-04-25T12:00:00Z');

  it('returns false when there is no token', () => {
    assert.strictEqual(
      isTokenValid({ now, token: null, tokenExpires: '2099-01-01T00:00:00Z' }),
      false
    );
  });

  it('returns false when there is no expiry', () => {
    assert.strictEqual(
      isTokenValid({ now, token: 'abc', tokenExpires: null }),
      false
    );
  });

  it('returns false when the expiry is in the past', () => {
    assert.strictEqual(
      isTokenValid({ now, token: 'abc', tokenExpires: '2025-01-01T00:00:00Z' }),
      false
    );
  });

  it('returns true when token is set and expiry is in the future', () => {
    assert.strictEqual(
      isTokenValid({ now, token: 'abc', tokenExpires: '2099-01-01T00:00:00Z' }),
      true
    );
  });
});

describe('#utils/auth/parseAuthResponse', () => {
  it('rejects a missing payload', () => {
    assert.deepStrictEqual(parseAuthResponse(null, 'token'), { ok: false });
  });

  it('rejects a payload without a response envelope', () => {
    assert.deepStrictEqual(parseAuthResponse({}, 'token'), { ok: false });
  });

  it('rejects a non-OK status', () => {
    assert.deepStrictEqual(
      parseAuthResponse({ response: { status: 'ERROR' } }, 'token'),
      { ok: false }
    );
  });

  it('rejects when the configured token field is empty', () => {
    assert.deepStrictEqual(
      parseAuthResponse({ response: { status: 'OK', token: '' } }, 'token'),
      { ok: false }
    );
  });

  it('returns the token when status is OK and the field is present', () => {
    assert.deepStrictEqual(
      parseAuthResponse({ response: { status: 'OK', token: 'abc' } }, 'token'),
      { ok: true, token: 'abc' }
    );
  });

  it('honors the configured token field name', () => {
    assert.deepStrictEqual(
      parseAuthResponse({ response: { status: 'OK', accessToken: 'xyz' } }, 'accessToken'),
      { ok: true, token: 'xyz' }
    );
  });
});

describe('#utils/auth/computeTokenExpires', () => {
  it('adds the configured minutes to the current time', () => {
    const now = new Date('2026-04-25T12:00:00Z');
    const out = computeTokenExpires({ now, expiresInMinutes: 120 });
    assert.strictEqual(out.toISOString(), '2026-04-25T14:00:00.000Z');
  });
});

describe('#utils/auth/fetchToken', () => {
  function configFor(values) {
    return { resolveValue: (k) => values[k] };
  }

  it('POSTs to the auth endpoint with the resolved body and returns the token from the configured field', async () => {
    const captured = [];
    const http = {
      request: async (req) => {
        captured.push(req);
        return { response: { status: 'OK', accessToken: 'tok-fresh' } };
      },
    };
    const config = configFor({
      apiAuthenticationEndpoint: '/auth',
      apiTokenResponseField: 'accessToken',
      apiAuthenticationJson: '{"u":"x","p":"y"}',
    });

    const token = await fetchToken({ http, config });

    assert.strictEqual(token, 'tok-fresh');
    assert.deepStrictEqual(captured[0], {
      method: 'POST',
      endpoint: '/auth',
      data: { u: 'x', p: 'y' },
    });
  });

  it('wraps a transport failure with cause', async () => {
    const http = { request: async () => { throw new Error('econnrefused'); } };
    const config = configFor({
      apiAuthenticationEndpoint: '/auth',
      apiTokenResponseField: 'token',
      apiAuthenticationJson: '{}',
    });

    await assert.rejects(
      fetchToken({ http, config }),
      (err) => err.message.includes('Failed to execute api call') && err.message.includes('econnrefused')
    );
  });

  it('throws a descriptive error when the response shape is wrong', async () => {
    const http = { request: async () => ({ response: { status: 'ERROR' } }) };
    const config = configFor({
      apiAuthenticationEndpoint: '/auth',
      apiTokenResponseField: 'token',
      apiAuthenticationJson: '{}',
    });

    await assert.rejects(
      fetchToken({ http, config }),
      /Something wrong happened on authentication/
    );
  });
});

describe('#utils/auth/resolveAuthBody', () => {
  it('parses the configured JSON blob into an object', () => {
    const config = {
      resolveValue: (key) => key === 'apiAuthenticationJson'
        ? '{"auth":{"u":"x","p":"y"}}' : null,
    };
    assert.deepStrictEqual(resolveAuthBody(config), { auth: { u: 'x', p: 'y' } });
  });

  it('throws a descriptive error when the configured value is not valid JSON', () => {
    const config = {
      resolveValue: () => '{ this is not json',
    };
    assert.throws(
      () => resolveAuthBody(config),
      /apiAuthenticationJson is not valid JSON/
    );
  });
});
