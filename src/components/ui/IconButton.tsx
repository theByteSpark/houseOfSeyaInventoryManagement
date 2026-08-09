import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

type Tone = 'neutral' | 'brand' | 'danger' | 'amber';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  label: string;
  children: ReactNode;
  isLoading?: boolean;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'text-graphite-500 hover:bg-graphite-100 hover:text-graphite-800',
  brand: 'text-sky-600 hover:bg-sky-50 hover:text-sky-700',
  danger: 'text-red-600 hover:bg-red-50 hover:text-red-700',
  amber: 'text-amber-700 hover:bg-amber-50 hover:text-amber-800',
};

export function IconButton({ tone = 'neutral', label, className, children, isLoading, ...rest }: IconButtonProps) {
  return (
    <span className="group/tooltip relative inline-flex">
      <button
        type="button"
        aria-label={label}
        disabled={isLoading || rest.disabled}
        className={cn(
          'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite-400',
          'disabled:cursor-not-allowed disabled:opacity-40',
          toneClasses[tone],
          className,
        )}
        {...rest}
      >
        {isLoading ? <Spinner className="h-4 w-4" /> : children}
      </button>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-graphite-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity delay-300 duration-100',
          'group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100',
        )}
      >
        {label}
      </span>
    </span>
  );
}
