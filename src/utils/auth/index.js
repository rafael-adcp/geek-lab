export function isTokenValid({ now, token, tokenExpires }) {
  if (!token) return false;
  if (!tokenExpires) return false;
  return now < new Date(tokenExpires);
}

export function parseAuthResponse(payload, tokenField) {
  if (!payload || !payload.response || payload.response.status !== 'OK') {
    return { ok: false };
  }
  const token = payload.response[tokenField];
  if (!token) return { ok: false };
  return { ok: true, token };
}

export function computeTokenExpires({ now, expiresInMinutes }) {
  return new Date(now.getTime() + expiresInMinutes * 60000);
}

export function resolveAuthBody(config) {
  const raw = config.resolveValue('apiAuthenticationJson');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `apiAuthenticationJson is not valid JSON: ${e.message}`,
      { cause: e }
    );
  }
}

export async function fetchToken({ http, config }) {
  let apiResponse;
  try {
    apiResponse = await http.request({
      method: 'POST',
      endpoint: config.resolveValue('apiAuthenticationEndpoint'),
      data: resolveAuthBody(config),
    });
  } catch (e) {
    throw new Error(`Failed to execute api call: ${e.message}`, { cause: e });
  }

  const parsed = parseAuthResponse(apiResponse, config.resolveValue('apiTokenResponseField'));
  if (!parsed.ok) {
    throw new Error(
      `Something wrong happened on authentication. Got payload: ${JSON.stringify(apiResponse)}`
    );
  }
  return parsed.token;
}
