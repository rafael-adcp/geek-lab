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
