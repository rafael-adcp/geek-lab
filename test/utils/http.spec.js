import assert from 'node:assert/strict';
import { createHttpClient } from '../../src/utils/http/index.js';

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

describe('#utils/http/request', () => {
  it('rejects when called without params', async () => {
    await assert.rejects(buildRequest()(), /No params were provided/);
  });

  it('rejects when method is missing', async () => {
    await assert.rejects(
      buildRequest()({ endpoint: '/x' }),
      /at least a method and an endpoint/
    );
  });

  it('rejects when endpoint is missing', async () => {
    await assert.rejects(
      buildRequest()({ method: 'GET' }),
      /at least a method and an endpoint/
    );
  });

  it('rejects when method is outside the allow list', async () => {
    await assert.rejects(
      buildRequest()({ method: 'PATCH', endpoint: '/x' }),
      /Invalid method provided/
    );
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
  });
});
