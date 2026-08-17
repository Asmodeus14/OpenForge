'use client';

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const FIELD = cn(
  'w-full rounded-md bg-surface text-fg placeholder:text-fg-muted',
  'border border-line shadow-[var(--shadow-sm)]',
  'transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]',
  'hover:border-line-strong',
  // A ring rather than a thicker border, so focus never shifts layout.
  'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-subtle',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* A visible label always. Placeholder text disappears the moment
          someone types, taking the only explanation of the field with it. */}
      {label && (
        <label htmlFor={id} className="text-secondary font-medium text-fg">
          {label}
          {required && (
            <span className="ml-1 text-fg-muted" aria-hidden>
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
        <p id={`${id}-hint`} className="text-meta text-fg-muted">
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
  /** Mono face — for addresses, hashes, amounts and identifiers only. */
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
  const generated = useId();
  const id = providedId ?? generated;

  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <div className="relative flex items-center">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 flex text-fg-muted" aria-hidden>
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
            FIELD,
            'h-10 px-3 text-body',
            mono && 'font-mono text-code',
            leadingIcon && 'pl-10',
            trailingSlot && 'pr-10',
            error && 'border-danger-line focus:border-danger focus:ring-danger-subtle',
            className,
          )}
          {...props}
        />
        {trailingSlot && (
          <span className="absolute right-2 flex items-center">{trailingSlot}</span>
        )}
      </div>
    </Field>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
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
  const generated = useId();
  const id = providedId ?? generated;
  const length = typeof value === 'string' ? value.length : 0;

  return (
    <Field
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
        className={cn(FIELD, 'min-h-28 resize-y px-3 py-2.5 text-body', error && 'border-danger-line', className)}
        {...props}
      />
      {showCount && maxLength !== undefined && (
        <p
          className={cn(
            'self-end text-micro tabular-nums',
            length >= maxLength ? 'text-warning-text' : 'text-fg-muted',
          )}
        >
          {length} / {maxLength}
        </p>
      )}
    </Field>
  );
});
