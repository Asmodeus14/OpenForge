'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from './buttonStyles';

// Re-exported so consumers have a single import site for the component and
// its types, even though the styles must live in a non-client module.
export { buttonClasses };
export type { ButtonVariant, ButtonSize };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks input, keeping the label visible so the user
   *  never loses track of what they pressed. */
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  /** Fully rounded. For invitations, not for form controls. */
  pill?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth,
    pill,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size, fullWidth, pill }), className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — an icon alone is not a label, for screen readers or anyone
   *  else. Doubles as the tooltip. */
  label: string;
  icon: ReactNode;
  size?: 'sm' | 'md';
  /** `primary` is for the one icon button that *is* the point of its surface
   *  — a composer's send button. Everything else stays quiet. */
  variant?: 'ghost' | 'secondary' | 'primary';
}

const ICON_BUTTON_VARIANTS = {
  ghost: 'text-fg-secondary hover:bg-subtle hover:text-fg',
  secondary: 'of-btn-face border border-line text-fg hover:border-line-strong',
  primary: 'of-btn-primary text-fg-on-accent',
} as const;

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
          'inline-flex shrink-0 items-center justify-center rounded-lg',
          'transition-[background-color,background-image,border-color,color,transform,box-shadow]',
          'duration-[var(--dur-fast)] ease-[var(--ease-out)]',
          'active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40',
          size === 'sm' ? 'size-8' : 'size-10',
          ICON_BUTTON_VARIANTS[variant],
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    );
  },
);
