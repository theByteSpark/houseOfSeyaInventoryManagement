import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, rows = 3, ...rest }, ref) => {
    const textareaId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-[13px] font-medium text-graphite-700">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            'resize-y rounded-md border px-3 py-2 text-sm text-graphite-900 placeholder:text-graphite-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500',
            'disabled:bg-graphite-50 disabled:text-graphite-400',
            error ? 'border-red-400' : 'border-graphite-300',
            className,
          )}
          {...rest}
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
Textarea.displayName = 'Textarea';
