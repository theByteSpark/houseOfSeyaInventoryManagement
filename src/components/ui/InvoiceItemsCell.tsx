import { useState } from 'react';
import { formatCurrency } from '@/lib/format';

interface InvoiceLineItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

const COLLAPSED_LIMIT = 3;

export function InvoiceItemsCell({ items }: { items: InvoiceLineItem[] }) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return <span className="text-graphite-300">—</span>;
  }

  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_LIMIT);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <div className="min-w-0 max-w-xs divide-y divide-graphite-100 rounded-md border border-graphite-100 bg-graphite-50/60 text-xs sm:min-w-[220px]">
      {visibleItems.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 px-2.5 py-1.5">
          <span className="truncate text-graphite-700" title={item.productName}>
            {item.productName}
          </span>
          <span className="shrink-0 whitespace-nowrap font-mono text-graphite-500">
            {item.quantity} × {formatCurrency(item.unitPrice)}
          </span>
        </div>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          className="w-full cursor-pointer px-2.5 py-1.5 text-left font-medium text-brand-600 hover:underline"
        >
          +{hiddenCount} more item{hiddenCount === 1 ? '' : 's'}
        </button>
      )}
    </div>
  );
}
