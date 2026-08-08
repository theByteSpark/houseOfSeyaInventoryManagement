// Tokens are persisted in localStorage so a session survives a page reload
// without relying on a cross-origin cookie. apiClient's interceptor reads/writes
// this outside of React so it stays in sync across concurrent requests.

const ACCESS_TOKEN_KEY = 'hos-access-token';
const REFRESH_TOKEN_KEY = 'hos-refresh-token';

let accessToken: string | null = localStorage.getItem(ACCESS_TOKEN_KEY);

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
