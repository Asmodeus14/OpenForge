import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../cn';

export type ButtonVariant =
  /** The one primary action on a surface. Accent-filled. */
  | 'primary'
  /** Standard action. Bordered, no fill. */
  | 'secondary'
  /** Low-emphasis action. No border until hovered. */
  | 'ghost'
  /** Destructive or irreversible. Never use `primary` for these. */
  | 'danger'
  /** Reads as a link but behaves as a button. */
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active border border-transparent',
  secondary:
    'bg-surface text-fg border border-line hover:bg-raised hover:border-line-strong',
  ghost:
    'bg-transparent text-fg-muted border border-transparent hover:bg-raised hover:text-fg',
  danger:
    'bg-danger text-white hover:brightness-110 active:brightness-95 border border-transparent',
  link: 'bg-transparent text-accent-text border border-transparent hover:underline underline-offset-4 px-0',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-meta gap-1.5',
  md: 'h-9 px-4 text-secondary gap-2',
  lg: 'h-11 px-5 text-body gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction. Keeps the label visible so the
   *  user never loses track of what they pressed. */
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth,
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
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap',
        'transition-colors duration-[var(--dur-hover)]',
        'disabled:opacity-45 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
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
