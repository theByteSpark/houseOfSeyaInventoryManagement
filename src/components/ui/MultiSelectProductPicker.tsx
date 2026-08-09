import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

export interface ProductPickerItem {
  id: string;
  name: string;
  sku: string;
  quantityInStock: number;
  unitPrice: number;
}

interface MultiSelectProductPickerProps {
  products: ProductPickerItem[];
  selectedIds: string[];
  onToggle: (productId: string) => void;
  placeholder?: string;
  label?: string;
  isLoading?: boolean;
}

export function MultiSelectProductPicker({
  products,
  selectedIds,
  onToggle,
  placeholder = 'Search products to add…',
  label,
  isLoading = false,
}: MultiSelectProductPickerProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCount = selectedIds.length;

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-[13px] font-medium text-graphite-700">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-md border border-graphite-300 bg-white px-3 py-2 text-left text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500',
            'hover:border-graphite-400',
          )}
          onClick={() => setIsOpen((v) => !v)}
        >
          <span className={cn(selectedCount > 0 ? 'text-graphite-900' : 'text-graphite-400')}>
            {selectedCount > 0
              ? `${selectedCount} product${selectedCount > 1 ? 's' : ''} selected`
              : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-graphite-400" strokeWidth={2} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-graphite-200 bg-white shadow-lg">
            <div className="relative border-b border-graphite-100 p-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-400" strokeWidth={2} />
              <input
                type="text"
                className="w-full rounded-md border border-graphite-200 bg-white py-1.5 pl-8 pr-3 text-sm text-graphite-900 placeholder:text-graphite-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500"
                placeholder="Search by name or SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center px-3 py-6">
                  <Spinner className="h-5 w-5" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-graphite-400">No products found</div>
              ) : (
                filtered.map((product) => {
                  const isSelected = selectedSet.has(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                        isSelected ? 'bg-brand-50' : 'hover:bg-graphite-50',
                      )}
                      onClick={() => onToggle(product.id)}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                          isSelected
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-graphite-300 bg-white',
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-graphite-900">{product.name}</span>
                        <span className="truncate text-xs text-graphite-400">
                          {product.sku} · Stock: {product.quantityInStock}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
