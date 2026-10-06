import { forwardRef, type ChangeEvent, type FocusEvent, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Number inputs: shows 0 when empty, selects it on focus, and never keeps leading zeros (05 → 5). */
  zeroDefault?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, zeroDefault, onChange, onFocus, onBlur, ...rest }, ref) => {
    const inputId = id ?? rest.name;

    const zeroHandlers = zeroDefault
      ? {
          onFocus: (e: FocusEvent<HTMLInputElement>) => {
            if (e.target.value === '0') e.target.select();
            onFocus?.(e);
          },
          onChange: (e: ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value;
            // Strip leading zeros from integers ("05" -> "5"), keep "0" and "0.5".
            if (/^0\d/.test(v)) e.target.value = v.replace(/^0+(?=\d)/, '');
            onChange?.(e);
          },
          onBlur: (e: FocusEvent<HTMLInputElement>) => {
            if (e.target.value === '') {
              // Restore the default through the native setter so react-hook-form sees the change.
              const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
              setter?.call(e.target, '0');
              e.target.dispatchEvent(new Event('input', { bubbles: true }));
            }
            onBlur?.(e);
          },
        }
      : { onFocus, onChange, onBlur };
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
          {...zeroHandlers}
        />
        {error ? (
          <span className="text-xs text-red-600">{error}</span>
        ) : hint ? (
          <span className="text-xs text-graphite-400">{hint}</span>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
