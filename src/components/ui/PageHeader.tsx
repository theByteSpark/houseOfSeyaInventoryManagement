import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-graphite-200 pb-4 sm:mb-6 sm:pb-5">
      <div className="min-w-0">
        <h1 className="text-[17px] font-semibold tracking-tight text-graphite-900 sm:text-[19px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-graphite-500">{description}</p>}
      </div>
      {action && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end [&>div]:flex-wrap">{action}</div>}
    </div>
  );
}
