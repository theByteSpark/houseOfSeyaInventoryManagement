import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 shadow-sm',
  secondary:
    'bg-white text-graphite-700 border border-graphite-300 hover:bg-graphite-50 hover:border-graphite-400 focus-visible:outline-graphite-400',
  danger: 'bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700 shadow-sm',
  ghost: 'bg-transparent text-graphite-600 hover:bg-graphite-100 focus-visible:outline-graphite-400',
};

const sizeClasses: Record<Size, string> = {
  sm: 'min-h-8 px-3 py-1.5 text-[13px] gap-1.5',
  md: 'min-h-9 px-4 py-2 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md font-medium tracking-tight transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
