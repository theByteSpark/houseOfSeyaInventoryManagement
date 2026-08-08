import { apiClient } from '@/lib/apiClient';
import type { User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}

export async function refreshSession(
  refreshToken: string,
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const { data } = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>(
    '/auth/refresh',
    { refreshToken },
  );
  return data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function verifyResetCode(email: string, code: string): Promise<{ resetToken: string }> {
  const { data } = await apiClient.post<{ resetToken: string }>('/auth/verify-reset-code', { email, code });
  return data;
}

export async function resetPassword(resetToken: string, password: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { resetToken, password });
}
