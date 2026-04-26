import isEmpty from 'lodash/isEmpty.js';

const ALLOWED_METHODS = ['POST', 'GET', 'DELETE', 'PUT'];

export function createHttpClient({ axios, fs, getToken, getBaseUrl }) {
  async function request(params) {
    if (isEmpty(params)) {
      throw new Error('No params were provided');
    }

    const method = params.method || null;
    const rawEndpoint = params.endpoint || null;

    let data;
    if (params.data) {
      data = typeof params.data === 'string' && params.data.startsWith('@')
        ? fs.readFileSync(params.data.replace('@', ''), 'utf8')
        : params.data;
    }

    if (!method || !rawEndpoint) {
      console.log('provided information:');
      console.log(`method: ${method}`);
      console.log(`endpoint: ${rawEndpoint}`);
      throw new Error('To perform a request you must provide at least a method and an endpoint');
    }

    const upper = method.toUpperCase();
    if (!ALLOWED_METHODS.includes(upper)) {
      console.log(`provided: ${upper}`);
      throw new Error('Invalid method provided');
    }

    const endpoint = rawEndpoint.startsWith('/') ? rawEndpoint : `/${rawEndpoint}`;

    const res = await axios.request({
      method: upper,
      url: getBaseUrl() + endpoint,
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

