import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-graphite-200 bg-white shadow-sm', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-graphite-100 px-4 py-3 sm:px-5 sm:py-4">
      <div className="min-w-0 flex-1 basis-32">
        <h2 className="text-[15px] font-semibold text-graphite-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-graphite-500">{description}</p>}
      </div>
      {action && <div className="max-w-full">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-4 py-3 sm:px-5 sm:py-4', className)}>{children}</div>;
}
