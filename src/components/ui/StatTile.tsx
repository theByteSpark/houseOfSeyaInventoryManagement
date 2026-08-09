import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'warning' | 'danger';

const toneAccent: Record<Tone, string> = {
  neutral: 'text-graphite-900',
  warning: 'text-amber-700',
  danger: 'text-red-700',
};

const iconTone: Record<Tone, string> = {
  neutral: 'text-graphite-400 bg-graphite-50',
  warning: 'text-amber-600 bg-amber-50',
  danger: 'text-red-600 bg-red-50',
};

export function StatTile({
  label,
  value,
  icon,
  tone = 'neutral',
  hint,
  onClick,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  hint?: string;
  onClick?: () => void;
}) {
  const Container = onClick ? 'button' : 'div';

  return (
    <Container
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'w-full min-w-0 rounded-lg border border-graphite-200 bg-white p-3 text-left shadow-sm sm:p-5',
        onClick &&
          'cursor-pointer transition-colors hover:border-graphite-300 hover:bg-graphite-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[12px] font-medium text-graphite-500 sm:text-[13px]">{label}</span>
        {icon && (
          <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md sm:h-8 sm:w-8', iconTone[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className={cn('mt-2 truncate text-[18px] font-semibold leading-none tabular-nums sm:mt-3 sm:text-[26px]', toneAccent[tone])}>{value}</p>
      {hint && <p className="mt-2 truncate text-xs text-graphite-400">{hint}</p>}
    </Container>
  );
}
