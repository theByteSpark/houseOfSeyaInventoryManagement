import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';

export interface CsvImportRowResult {
  row: number;
  status: 'created' | 'updated' | 'error';
  message?: string;
  [key: string]: unknown;
}

export interface CsvImportResult {
  results: CsvImportRowResult[];
  createdCount: number;
  updatedCount?: number;
  errorCount: number;
}

export function CsvImportModal({
  isOpen,
  onClose,
  title,
  templateUrl,
  templateFilename,
  onUpload,
  onImported,
  rowLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateUrl: string;
  templateFilename: string;
  onUpload: (file: File) => Promise<CsvImportResult>;
  onImported?: () => void;
  rowLabel: (row: CsvImportRowResult) => string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    const url = format === 'xlsx' ? `${templateUrl}?format=xlsx` : templateUrl;
    const filename =
      format === 'xlsx'
        ? templateFilename.replace(/\.csv$/, '.xlsx')
        : templateFilename;
    try {
      const res = await apiClient.get(url, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError('Failed to download template.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const res = await onUpload(selectedFile);
      setResult(res);
      onImported?.();
    } catch (err) {
      setError(extractErrorMessage(err, 'Import failed.'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={handleClose}>
            {result ? 'Done' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile}
              isLoading={isUploading}
              icon={<Upload className="h-4 w-4" strokeWidth={2} />}
            >
              Upload
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-md border border-graphite-200 bg-graphite-50 p-3">
          <p className="mb-2 text-sm text-graphite-600">
            Download a template, fill it in, then upload it below.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => handleDownloadTemplate('csv')}
              icon={<Download className="h-4 w-4" strokeWidth={2} />}
            >
              CSV template
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => handleDownloadTemplate('xlsx')}
              icon={<Download className="h-4 w-4" strokeWidth={2} />}
            >
              Excel template
            </Button>
          </div>
        </div>

        {!result && (
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-graphite-700">CSV or Excel file</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer rounded-md border border-graphite-300 text-sm text-graphite-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-graphite-100 file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-graphite-700 hover:file:bg-graphite-200"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-sm">
              {result.createdCount > 0 && (
                <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">
                  {result.createdCount} created
                </span>
              )}
              {typeof result.updatedCount === 'number' && result.updatedCount > 0 && (
                <span className="rounded border border-brand-200 bg-brand-50 px-2 py-1 text-brand-700">
                  {result.updatedCount} updated
                </span>
              )}
              {result.errorCount > 0 && (
                <span className="rounded border border-red-200 bg-red-50 px-2 py-1 text-red-700">
                  {result.errorCount} failed
                </span>
              )}
            </div>

            {result.errorCount > 0 && (
              <div className="max-h-56 overflow-auto rounded-md border border-graphite-200">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="bg-graphite-50 text-[11px] uppercase tracking-wide text-graphite-400">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Detail</th>
                      <th className="px-3 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results
                      .filter((r) => r.status === 'error')
                      .map((r) => (
                        <tr key={r.row} className="border-t border-graphite-100">
                          <td className="px-3 py-2 text-graphite-500">{r.row}</td>
                          <td className="px-3 py-2 text-graphite-700">{rowLabel(r)}</td>
                          <td className="px-3 py-2 text-red-600">{r.message}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
