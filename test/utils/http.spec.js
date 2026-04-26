import assert from 'node:assert/strict';
import {
  createHttpClient,
  validateRequest,
  resolveBody,
  normalizeEndpoint,
} from '../../src/utils/http/index.js';

const noopAxios = { request: () => Promise.resolve({ data: null }) };
const noopFs = { readFileSync: () => 'file contents' };

function buildRequest({ axios = noopAxios, fs = noopFs } = {}) {
  return createHttpClient({
    axios,
    fs,
    getToken: () => 'token',
    getBaseUrl: () => 'https://example.test',
  }).request;
}

describe('#utils/http/validateRequest', () => {
  it('rejects when called without params', () => {
    assert.throws(() => validateRequest(), /No params were provided/);
  });

  it('rejects when method is missing, naming the offending field', () => {
    assert.throws(
      () => validateRequest({ endpoint: '/x' }),
      /method=null/
    );
  });

  it('rejects when endpoint is missing, naming the offending field', () => {
    assert.throws(
      () => validateRequest({ method: 'GET' }),
      /endpoint=null/
    );
  });

  it('rejects when method is outside the allow list', () => {
    assert.throws(
      () => validateRequest({ method: 'PATCH', endpoint: '/x' }),
      /Invalid method provided/
    );
  });

  it('returns the upper-cased method when valid', () => {
    assert.deepStrictEqual(
      validateRequest({ method: 'get', endpoint: '/x' }),
      { method: 'GET', endpoint: '/x' }
    );
  });
});

describe('#utils/http/resolveBody', () => {
  it('returns undefined for falsy input', () => {
    assert.strictEqual(resolveBody(noopFs, undefined), undefined);
    assert.strictEqual(resolveBody(noopFs, ''), undefined);
    assert.strictEqual(resolveBody(noopFs, null), undefined);
  });

  it('reads the file when the body starts with @', () => {
    let captured;
    const fs = { readFileSync: (p, enc) => { captured = [p, enc]; return 'from disk'; } };
    assert.strictEqual(resolveBody(fs, '@payload.json'), 'from disk');
    assert.deepStrictEqual(captured, ['payload.json', 'utf8']);
  });

  it('passes object payloads through untouched (auth flow)', () => {
    const obj = { auth: { user: 'u' } };
    assert.strictEqual(resolveBody(noopFs, obj), obj);
  });

  it('passes plain string payloads through untouched', () => {
    assert.strictEqual(resolveBody(noopFs, '{"x":1}'), '{"x":1}');
  });
});

describe('#utils/http/normalizeEndpoint', () => {
  it('prepends a slash when missing', () => {
    assert.strictEqual(normalizeEndpoint('things'), '/things');
  });
  it('leaves an already-rooted endpoint alone', () => {
    assert.strictEqual(normalizeEndpoint('/things'), '/things');
  });
});

describe('#utils/http/request (integration of the three pieces)', () => {
  it('rejects when called without params', async () => {
    await assert.rejects(buildRequest()(), /No params were provided/);
  });

  it('reads file contents when data starts with @', async () => {
    const captured = [];
    const axios = {
      request: (req) => { captured.push(req); return Promise.resolve({ data: { ok: true } }); },
    };
    const fs = { readFileSync: () => 'from disk' };

    await buildRequest({ axios, fs })({
      method: 'POST',
      endpoint: '/x',
      data: '@payload.json',
    });

    assert.strictEqual(captured[0].data, 'from disk');
    assert.strictEqual(captured[0].url, 'https://example.test/x');
    assert.strictEqual(captured[0].method, 'POST');
    assert.strictEqual(captured[0].headers.Authorization, 'token');
  });
});
