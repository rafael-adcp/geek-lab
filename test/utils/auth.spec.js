import assert from 'node:assert/strict';
import {
  isTokenValid,
  parseAuthResponse,
  computeTokenExpires,
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
