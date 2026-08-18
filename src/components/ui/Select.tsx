import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...rest }, ref) => {
    const selectId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[13px] font-medium text-graphite-700">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'rounded-md border bg-white px-3 py-2 text-sm text-graphite-900',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500',
            error ? 'border-red-400' : 'border-graphite-300',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <span className="min-h-[1rem] text-xs text-red-600">{error}</span>
      </div>
    );
  },
);
Select.displayName = 'Select';
