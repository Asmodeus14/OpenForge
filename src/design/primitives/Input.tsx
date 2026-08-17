import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../cn';

const FIELD_BASE = cn(
  'w-full rounded-md bg-surface text-fg placeholder:text-fg-subtle',
  'border border-line',
  'transition-colors duration-[var(--dur-hover)]',
  'hover:border-line-strong',
  'focus:border-accent focus:outline-none focus-visible:outline-none',
  'disabled:opacity-45 disabled:cursor-not-allowed',
);

interface FieldShellProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Shared label/hint/error scaffolding.
 *
 * Errors are wired via `aria-describedby` and announced politely, so a
 * screen-reader user learns why a field was rejected without having to hunt
 * for it.
 */
function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-meta font-medium text-fg-muted">
          {label}
          {required && (
            <span className="text-danger-text ml-0.5" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-meta text-danger-text">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-meta text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  /** Renders the value in the mono face — use for addresses, hashes, amounts. */
  mono?: boolean;
  leadingIcon?: ReactNode;
  trailingSlot?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    mono,
    leadingIcon,
    trailingSlot,
    className,
    containerClassName,
    id: providedId,
    required,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <div className="relative flex items-center">
        {leadingIcon && (
          <span
            className="absolute left-3 text-fg-subtle pointer-events-none flex"
            aria-hidden
          >
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            FIELD_BASE,
            'h-9 px-3 text-secondary',
            mono && 'font-mono text-code',
            leadingIcon && 'pl-9',
            trailingSlot && 'pr-9',
            error && 'border-danger-line focus:border-danger',
            className,
          )}
          {...props}
        />
        {trailingSlot && (
          <span className="absolute right-2 flex items-center">{trailingSlot}</span>
        )}
      </div>
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  /** Shows a live `n/max` counter. Requires `maxLength`. */
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    className,
    containerClassName,
    id: providedId,
    required,
    showCount,
    maxLength,
    value,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const length = typeof value === 'string' ? value.length : 0;

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <textarea
        ref={ref}
        id={id}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          FIELD_BASE,
          'min-h-24 px-3 py-2 text-secondary resize-y',
          error && 'border-danger-line focus:border-danger',
          className,
        )}
        {...props}
      />
      {showCount && maxLength !== undefined && (
        <p
          className={cn(
            'text-meta tabular-nums self-end',
            length >= maxLength ? 'text-warning-text' : 'text-fg-subtle',
          )}
        >
          {length}/{maxLength}
        </p>
      )}
    </FieldShell>
  );
});
