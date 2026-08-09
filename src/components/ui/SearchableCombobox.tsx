import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

interface SearchableComboboxProps<T> {
  items: T[];
  value: string | null;
  onChange: (item: T) => void;
  onClear?: () => void;
  getOptionLabel: (item: T) => string;
  getOptionValue: (item: T) => string;
  getOptionSublabel?: (item: T) => string | null;
  placeholder?: string;
  label?: string;
  error?: string;
  addNewLabel?: string;
  onAddNew?: () => void;
  isLoading?: boolean;
}

export function SearchableCombobox<T>({
  items,
  value,
  onChange,
  onClear,
  getOptionLabel,
  getOptionValue,
  getOptionSublabel,
  placeholder = 'Search…',
  label,
  error,
  addNewLabel = 'Add new',
  onAddNew,
  isLoading = false,
}: SearchableComboboxProps<T>) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = useMemo(
    () => items.find((item) => getOptionValue(item) === value) ?? null,
    [items, value, getOptionValue],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => {
      const label = getOptionLabel(item).toLowerCase();
      const sub = getOptionSublabel?.(item)?.toLowerCase() ?? '';
      return label.includes(q) || sub.includes(q);
    });
  }, [items, search, getOptionLabel, getOptionSublabel]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

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

  const handleSelect = (item: T) => {
    onChange(item);
    setIsOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      if (filtered.length > 0 && highlightedIndex < filtered.length) {
        handleSelect(filtered[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-[13px] font-medium text-graphite-700">{label}</label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={cn(
            'w-full rounded-md border bg-white px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500',
            error ? 'border-red-400' : 'border-graphite-300',
          )}
          placeholder={selectedItem ? getOptionLabel(selectedItem) : placeholder}
          value={isOpen ? search : selectedItem ? getOptionLabel(selectedItem) : ''}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch('');
          }}
          onKeyDown={handleKeyDown}
        />
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-400" strokeWidth={2} />
        {selectedItem && onClear && !isOpen && (
          <button
            type="button"
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded p-0.5 text-graphite-400 hover:text-graphite-700"
            onClick={() => onClear()}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-graphite-200 bg-white shadow-lg">
            {isLoading ? (
              <div className="flex items-center justify-center px-3 py-6">
                <Spinner className="h-5 w-5" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-graphite-400">No results found</div>
            ) : (
              filtered.map((item, index) => (
                <button
                  key={getOptionValue(item)}
                  type="button"
                  className={cn(
                    'flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors',
                    highlightedIndex === index
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-graphite-700 hover:bg-graphite-50',
                  )}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="font-medium">{getOptionLabel(item)}</span>
                  {getOptionSublabel?.(item) && (
                    <span className="text-xs text-graphite-400">{getOptionSublabel(item)}</span>
                  )}
                </button>
              ))
            )}
            {onAddNew && (
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-graphite-100 px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50"
                onClick={() => {
                  setIsOpen(false);
                  setSearch('');
                  onAddNew();
                }}
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                {addNewLabel}
              </button>
            )}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
