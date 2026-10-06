import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DateInputProps {
  label?: string;
  error?: string;
  /** ISO date, YYYY-MM-DD, or '' when empty. */
  value: string;
  onChange: (iso: string) => void;
  className?: string;
}

const isoToDisplay = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
};

function displayToIso(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const valid = date.getFullYear() === Number(y) && date.getMonth() === Number(m) - 1 && date.getDate() === Number(d);
  return valid ? `${y}-${m}-${d}` : null;
}

/** Date field that shows and accepts DD/MM/YYYY, with a calendar picker. Value is ISO (YYYY-MM-DD). */
export function DateInput({ label, error, value, onChange, className }: DateInputProps) {
  const [text, setText] = useState(isoToDisplay(value));
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  const handleText = (raw: string) => {
    // Keep digits only and auto-insert the slashes: 25122026 -> 25/12/2026.
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    const masked = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
    setText(masked);
    if (masked === '') onChange('');
    else {
      const iso = displayToIso(masked);
      if (iso) onChange(iso);
    }
  };

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.focus();
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[13px] font-medium text-graphite-700">{label}</label>}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/YYYY"
          value={text}
          onChange={(e) => handleText(e.target.value)}
          onBlur={() => setText(isoToDisplay(value))}
          className={cn(
            'w-full rounded-md border bg-white px-3 py-2 pr-10 text-sm text-graphite-900 placeholder:text-graphite-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500',
            error ? 'border-red-400' : 'border-graphite-300',
            className,
          )}
        />
        <button
          type="button"
          onClick={openPicker}
          aria-label="Open calendar"
          title="Open calendar"
          className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700"
        >
          <CalendarDays className="h-4 w-4" strokeWidth={2} />
        </button>
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 opacity-0"
        />
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
