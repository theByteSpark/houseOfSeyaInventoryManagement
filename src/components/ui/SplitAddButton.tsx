import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface SplitAddButtonOption {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export function SplitAddButton({
  label,
  icon,
  onClick,
  options,
}: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  options: SplitAddButtonOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative flex w-full sm:inline-flex sm:w-auto">
      <Button onClick={onClick} icon={icon} className="flex-1 rounded-r-none sm:flex-initial">
        {label}
      </Button>
      <button
        type="button"
        aria-label="More add options"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-r-md border-l border-brand-700 bg-brand-600 px-2 text-white transition-colors hover:bg-brand-700',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        )}
      >
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-full max-w-[calc(100vw-2rem)] rounded-md border border-graphite-200 bg-white py-1 shadow-lg sm:w-52">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setOpen(false);
                opt.onClick();
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-graphite-700 hover:bg-graphite-50"
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
