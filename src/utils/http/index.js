const _ = require('lodash');

const ALLOWED_METHODS = ['POST', 'GET', 'DELETE', 'PUT'];

function createHttpClient({ axios, fs, getToken, getBaseUrl }) {
  async function request(params) {
    if (_.isEmpty(params)) {
      throw new Error('No params were provided');
    }

    const method = params.method || null;
    const rawEndpoint = params.endpoint || null;

    let data;
    if (!_.isEmpty(params.data)) {
      data = _.startsWith(params.data, '@')
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

    const endpoint = _.startsWith(rawEndpoint, '/') ? rawEndpoint : `/${rawEndpoint}`;

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

module.exports = { createHttpClient };
