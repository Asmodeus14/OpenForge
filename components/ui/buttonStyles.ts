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

/**
 * The four variants, as material rather than as flat fills.
 *
 * `primary` and `danger` are lit faces: a vertical gradient, a coloured glow
 * beneath, and a bright rim along the top edge. `secondary` is the same glass
 * the panels are made of, at control scale. `ghost` stays a bare label until
 * hovered, because a page where every control is a lit chip has no hierarchy
 * left to spend.
 *
 * The heavy lifting lives in `.of-btn-*` in `globals.css` — gradients, glows
 * and inset rims are unreadable as Tailwind arbitrary values, and they belong
 * with the other material definitions rather than scattered here.
 */
export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'of-btn-primary text-fg-on-accent',
  secondary: 'of-btn-face text-fg border border-line hover:border-line-strong',
  ghost: 'bg-transparent text-fg-secondary hover:bg-subtle hover:text-fg',
  danger: 'of-btn-danger text-white',
};

const BASE = cn(
  // `lg` rather than `md`. The surfaces around these moved to `2xl`, and an
  // 8px control inside a 16px panel reads as a leftover from another system.
  'inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap',
  'transition-[background-color,background-image,border-color,color,transform,box-shadow]',
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
  options: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    /**
     * Fully rounded, with wider side padding to suit the shape.
     *
     * For marketing and for the one or two places in the app that are an
     * invitation rather than a control — connecting a wallet, starting an
     * escrow. Deliberately not the default: a form full of pills reads as a
     * landing page, and the application is not one.
     */
    pill?: boolean;
  } = {},
): string {
  const { variant = 'secondary', size = 'md', fullWidth, pill } = options;
  return cn(
    BASE,
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    pill && 'rounded-full px-6',
    fullWidth && 'w-full',
  );
}
