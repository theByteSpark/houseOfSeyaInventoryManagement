import { apiClient } from '@/lib/apiClient';
import type { AttributeOption, AttributeType } from '@/types';

export interface AttributeOptionInput {
  type: AttributeType;
  label: string;
  sortOrder?: number;
}

export interface AttributeOptionUpdateInput {
  label?: string;
  sortOrder?: number;
}

export async function fetchAttributeOptions(type?: AttributeType): Promise<AttributeOption[]> {
  const { data } = await apiClient.get<AttributeOption[]>('/attribute-options', { params: type ? { type } : undefined });
  return data;
}

export async function createAttributeOption(input: AttributeOptionInput): Promise<AttributeOption> {
  const { data } = await apiClient.post<AttributeOption>('/attribute-options', input);
  return data;
}

export async function updateAttributeOption(id: string, input: AttributeOptionUpdateInput): Promise<AttributeOption> {
  const { data } = await apiClient.patch<AttributeOption>(`/attribute-options/${id}`, input);
  return data;
}

export async function deleteAttributeOption(id: string): Promise<void> {
  await apiClient.delete(`/attribute-options/${id}`);
}
