import { cn } from '@/lib/cn';

/**
 * Button styling, in a module with no `'use client'` directive so that
 * Server Components can call it too.
 *
 * It lives apart from `Button.tsx` deliberately: that file is a Client
 * Component, and anything exported from it — even a pure string function —
 * becomes unreachable from the server.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Heights are deliberately generous — 36/40/48 rather than the 28/32 of a
 * dense admin tool. Comfortable hit targets are most of what makes an
 * interface feel considered, and `lg` clears the 44px mobile guidance.
 */
export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-secondary gap-1.5',
  md: 'h-10 px-4 text-body gap-2',
  lg: 'h-12 px-6 text-body gap-2',
};

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-fg-on-accent hover:bg-accent-hover active:bg-accent-active shadow-[var(--shadow-sm)]',
  secondary:
    'bg-surface text-fg border border-line hover:border-line-strong hover:bg-subtle shadow-[var(--shadow-sm)]',
  ghost: 'bg-transparent text-fg-secondary hover:bg-subtle hover:text-fg',
  danger: 'bg-danger text-white hover:brightness-110 active:brightness-95',
};

const BASE = cn(
  'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap',
  'transition-[background-color,border-color,color,transform,box-shadow]',
  'duration-[var(--dur-fast)] ease-[var(--ease-out)]',
  // A barely-perceptible press. Physical feedback, not decoration.
  'active:scale-[0.98]',
  'disabled:pointer-events-none disabled:opacity-40',
);

/**
 * Button styling for elements that must not be a `<button>` — chiefly
 * `next/link`. Nesting an anchor inside a button is invalid HTML and breaks
 * keyboard and screen-reader behaviour, so links that look like buttons use
 * this rather than wrapping.
 */
export function buttonClasses(
  options: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean } = {},
): string {
  const { variant = 'secondary', size = 'md', fullWidth } = options;
  return cn(BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], fullWidth && 'w-full');
}
