import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'brand' | 'danger' | 'amber';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  label: string;
  children: ReactNode;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'text-graphite-500 hover:bg-graphite-100 hover:text-graphite-800',
  brand: 'text-sky-600 hover:bg-sky-50 hover:text-sky-700',
  danger: 'text-red-600 hover:bg-red-50 hover:text-red-700',
  amber: 'text-amber-700 hover:bg-amber-50 hover:text-amber-800',
};

export function IconButton({ tone = 'neutral', label, className, children, ...rest }: IconButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // Tooltip is portalled with fixed positioning so scroll/overflow containers can't clip it.
  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const flip = r.top < 40;
    setPos({ x: r.left + r.width / 2, y: flip ? r.bottom + 6 : r.top - 6 });
  };
  const hide = () => setPos(null);
  const flipped = pos !== null && ref.current ? ref.current.getBoundingClientRect().top < 40 : false;

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={cn(
          'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite-400',
          'disabled:cursor-not-allowed disabled:opacity-40',
          toneClasses[tone],
          className,
        )}
        {...rest}
      >
        {children}
      </button>
      {pos &&
        createPortal(
          <span
            role="tooltip"
            style={{ left: pos.x, top: pos.y }}
            className={cn(
              'pointer-events-none fixed z-[60] -translate-x-1/2 whitespace-nowrap rounded-md bg-graphite-900 px-2 py-1 text-[11px] font-medium text-white shadow-sm',
              flipped ? '' : '-translate-y-full',
            )}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  );
}
