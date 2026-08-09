import { apiClient } from '@/lib/apiClient';
import type { Role, User } from '@/types';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
  warehouseId?: string;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  warehouseId?: string;
}

export async function fetchUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users');
  return data;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await apiClient.post<User>('/users', input);
  return data;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const { data } = await apiClient.patch<User>(`/users/${id}`, input);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
