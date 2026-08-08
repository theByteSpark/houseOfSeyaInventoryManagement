import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from './tokenStore';

const baseURL =
  import.meta.env.VITE_API_URL ?? 'https://houseofseyainventorymanagementbackend-production.up.railway.app/api/v1';

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    const storedRefreshToken = getRefreshToken();
    refreshPromise = (
      storedRefreshToken
        ? axios.post<{ accessToken: string; refreshToken: string }>(`${baseURL}/auth/refresh`, {
            refreshToken: storedRefreshToken,
          })
        : Promise.reject(new Error('No refresh token'))
    )
      .then((res) => {
        setRefreshToken(res.data.refreshToken);
        return res.data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isAuthRoute = config?.url?.includes('/auth/');

    if (error.response?.status === 401 && config && !config._retried && !isAuthRoute) {
      config._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        setAccessToken(newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      }
      setAccessToken(null);
      setRefreshToken(null);
    }

    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
