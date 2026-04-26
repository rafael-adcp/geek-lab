import isEmpty from 'lodash/isEmpty.js';

const ALLOWED_METHODS = new Set(['POST', 'GET', 'DELETE', 'PUT']);

export function validateRequest(params) {
  if (isEmpty(params)) {
    throw new Error('No params were provided');
  }
  const { method, endpoint } = params;
  if (!method || !endpoint) {
    throw new Error(
      `To perform a request you must provide at least a method and an endpoint ` +
      `(got method=${method ?? 'null'}, endpoint=${endpoint ?? 'null'})`
    );
  }
  const upper = method.toUpperCase();
  if (!ALLOWED_METHODS.has(upper)) {
    throw new Error(`Invalid method provided (got ${upper})`);
  }
  return { method: upper, endpoint };
}

export function resolveBody(fs, raw) {
  if (!raw) return undefined;
  if (typeof raw === 'string' && raw.startsWith('@')) {
    return fs.readFileSync(raw.slice(1), 'utf8');
  }
  return raw;
}

export function normalizeEndpoint(endpoint) {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

export function createHttpClient({ axios, fs, getToken, getBaseUrl }) {
  async function request(params) {
    const { method, endpoint } = validateRequest(params);
    const data = resolveBody(fs, params.data);

    const res = await axios.request({
      method,
      url: getBaseUrl() + normalizeEndpoint(endpoint),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getToken(),
      },
      data,
    });

    return res.data;
  }

  return { request };
}
