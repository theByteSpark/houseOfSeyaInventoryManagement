import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-graphite-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'rounded-md border px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500',
            'disabled:bg-graphite-50 disabled:text-graphite-400',
            error ? 'border-red-400' : 'border-graphite-300',
            className,
          )}
          {...rest}
        />
        <span className="min-h-[1rem] text-xs text-red-600 empty:text-graphite-400">
          {error || hint}
        </span>
      </div>
    );
  },
);
Input.displayName = 'Input';
