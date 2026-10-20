import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, X } from 'lucide-react';
import { Button, Spinner } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { useCustomers } from '@/features/customers/hooks';
import type { Enquiry } from '@/types';

interface EstimatePdfModalProps {
  enquiry: Enquiry;
  onClose: () => void;
}

export function EstimatePdfModal({ enquiry, onClose }: EstimatePdfModalProps) {
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const customer = customers?.find((c) => c.id === enquiry.customerId);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    if (customersLoading) return;
    // Built in the browser from the enquiry + customer data, so the layout never depends on the server.
    import('./enquiryPdf')
      .then(({ buildEnquiryPdf }) => buildEnquiryPdf(enquiry, customer))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, 'Could not load the estimate PDF.'));
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enquiry, customer, customersLoading]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Estimate ${enquiry.customerName}.pdf`;
    link.click();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-900/50 p-4">
      <div role="dialog" aria-modal="true" className="flex h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-graphite-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-graphite-900">Estimate for {enquiry.customerName}</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleDownload} disabled={!blobUrl} icon={<Download className="h-3.5 w-3.5" strokeWidth={2} />}>
              Download
            </Button>
            <button
              onClick={onClose}
              aria-label="Close" title="Close"
              className="cursor-pointer rounded-md p-1 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-hidden bg-graphite-50">
          {error ? (
            <p className="px-6 text-center text-sm text-red-600">{error}</p>
          ) : !blobUrl ? (
            <Spinner />
          ) : (
            <iframe src={blobUrl} title={`Estimate for ${enquiry.customerName}`} className="h-full w-full border-0" />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
