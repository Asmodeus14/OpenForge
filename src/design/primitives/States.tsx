import type { ReactNode } from 'react';
import { Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import { cn } from '../cn';
import { Button } from './Button';
import { parseError } from '../../lib/errors';

/* ----------------------------------------------------------------- loading */

/**
 * Skeletons, not spinners, for content areas (§24). A skeleton communicates
 * the shape of what is coming; a spinner communicates only "wait".
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-sm bg-raised', className)}
      aria-hidden
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

/** Reserved for inline, in-button, or genuinely unknown-shape waits. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2', className)}>
      <Loader2 className="size-4 animate-spin text-fg-muted" aria-hidden />
      {label && <span className="text-secondary text-fg-muted">{label}</span>}
      <span className="sr-only">{label ?? 'Loading'}</span>
    </span>
  );
}

/* ------------------------------------------------------------------- empty */

/**
 * Every empty state must say WHAT is empty, WHY, and WHAT to do next (§23).
 * "No data" is not an acceptable empty state.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  /** Explain why it is empty and what would fill it. */
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="flex size-10 items-center justify-center rounded-lg bg-raised text-fg-subtle">
          {icon}
        </div>
      )}
      <div className="max-w-sm">
        <h3 className="text-section text-fg">{title}</h3>
        <p className="mt-1 text-secondary text-fg-muted">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------- error */

/**
 * Error state with honest, translated copy and a retry path (§25).
 *
 * Pass the caught error and a `context` naming what failed; the technical
 * detail is available but tucked behind a disclosure so it never shouts a
 * stack trace at someone.
 */
export function ErrorState({
  error,
  context,
  onRetry,
  className,
  compact,
}: {
  error: unknown;
  /** e.g. "Projects could not be loaded". */
  context?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const parsed = parseError(error, context);

  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-danger-line bg-danger-subtle',
        compact ? 'px-3 py-2.5' : 'px-4 py-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger-text" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-secondary font-medium text-fg">{parsed.title}</p>
          <p className="mt-1 text-secondary text-fg-muted">{parsed.message}</p>

          {parsed.raw && (
            <details className="mt-2">
              <summary className="cursor-pointer text-meta text-fg-subtle hover:text-fg-muted">
                Technical details
              </summary>
              <pre className="mt-1.5 overflow-x-auto rounded-sm bg-sunken p-2 text-code text-fg-subtle">
                {parsed.raw}
              </pre>
            </details>
          )}

          {onRetry && parsed.retryable && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={onRetry}
              leadingIcon={<RefreshCw className="size-3.5" aria-hidden />}
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ alerts */

export function Alert({
  tone = 'info',
  title,
  children,
  icon,
  className,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'border-info-line bg-info-subtle text-info-text',
    warning: 'border-warning-line bg-warning-subtle text-warning-text',
    danger: 'border-danger-line bg-danger-subtle text-danger-text',
    success: 'border-success-line bg-success-subtle text-success-text',
  } as const;

  return (
    <div
      className={cn('rounded-md border px-3 py-2.5', tones[tone], className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div className="flex items-start gap-2.5">
        {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
        <div className="min-w-0 text-secondary">
          {title && <p className="font-medium text-fg">{title}</p>}
          <div className={cn(title && 'mt-0.5', 'text-fg-muted')}>{children}</div>
        </div>
      </div>
    </div>
  );
}
