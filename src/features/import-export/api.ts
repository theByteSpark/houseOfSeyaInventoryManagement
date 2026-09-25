import { apiClient } from '@/lib/apiClient';
import type { CsvImportResult } from '@/components/ui';

export async function uploadCsv(url: string, file: File): Promise<CsvImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<CsvImportResult>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export function importProductsCsv(file: File): Promise<CsvImportResult> {
  return uploadCsv('/import/products', file);
}

export function importCustomersCsv(file: File): Promise<CsvImportResult> {
  return uploadCsv('/import/customers', file);
}

export function importVendorsCsv(file: File): Promise<CsvImportResult> {
  return uploadCsv('/import/vendors', file);
}

export function importSalesCsv(file: File): Promise<CsvImportResult> {
  return uploadCsv('/import/sales', file);
}

export function importPurchasesCsv(file: File): Promise<CsvImportResult> {
  return uploadCsv('/import/purchases', file);
}
