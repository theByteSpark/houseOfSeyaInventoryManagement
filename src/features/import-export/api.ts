import { apiClient } from '@/lib/apiClient';
import type { CsvImportResult } from '@/components/ui';

async function uploadCsv(url: string, file: File, warehouseId?: string): Promise<CsvImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (warehouseId) formData.append('warehouseId', warehouseId);
  const { data } = await apiClient.post<CsvImportResult>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export function importProductsCsv(file: File, warehouseId?: string): Promise<CsvImportResult> {
  return uploadCsv('/import/products', file, warehouseId);
}

export function importSalesCsv(file: File, warehouseId?: string): Promise<CsvImportResult> {
  return uploadCsv('/import/sales', file, warehouseId);
}

export function importPurchasesCsv(file: File, warehouseId?: string): Promise<CsvImportResult> {
  return uploadCsv('/import/purchases', file, warehouseId);
}

export function importCustomersCsv(file: File): Promise<CsvImportResult> {
  return uploadCsv('/import/customers', file);
}

export function importVendorsCsv(file: File): Promise<CsvImportResult> {
  return uploadCsv('/import/vendors', file);
}
