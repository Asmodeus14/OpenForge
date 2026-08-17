import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../cn';

const SIZES = {
  sm: 'size-7',
  md: 'size-9',
  lg: 'size-10',
} as const;

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Required. An icon alone is never self-explanatory to a screen reader, and
   * often not to a sighted user either — this also becomes the tooltip.
   */
  label: string;
  icon: ReactNode;
  size?: keyof typeof SIZES;
  variant?: 'ghost' | 'secondary';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, icon, size = 'md', variant = 'ghost', className, type = 'button', ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex items-center justify-center rounded-md shrink-0',
          'transition-colors duration-[var(--dur-hover)]',
          'disabled:opacity-45 disabled:pointer-events-none',
          variant === 'ghost'
            ? 'text-fg-muted hover:bg-raised hover:text-fg'
            : 'border border-line bg-surface text-fg hover:bg-raised hover:border-line-strong',
          SIZES[size],
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    );
  },
);
