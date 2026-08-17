'use client';

import type { ReactNode } from 'react';
import { Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { parseError } from '@/lib/errors';

/* ---------------------------------------------------------------- loading */

/**
 * Skeletons, not spinners. A skeleton communicates the shape of what is
 * arriving; a spinner communicates only "wait". Skeletons should mirror the
 * real layout closely enough that nothing jumps when content lands.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-sm bg-subtle', className)} aria-hidden />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/** For inline and in-button waits only, never as a page's loading state. */
export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2', className)}>
      <Loader2 className="size-4 animate-spin text-fg-muted" aria-hidden />
      {label && <span className="text-secondary text-fg-secondary">{label}</span>}
      <span className="sr-only">{label ?? 'Loading'}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ empty */

/**
 * Every empty state says WHAT is empty, WHY, and WHAT to do next.
 * "No data found" is never acceptable.
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
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-20 text-center', className)}>
      {icon && (
        <div className="mb-5 flex size-12 items-center justify-center rounded-xl border border-line bg-subtle text-fg-muted">
          {icon}
        </div>
      )}
      <h3 className="text-section text-fg">{title}</h3>
      <p className="mt-2 max-w-sm text-body text-fg-secondary">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ error */

/**
 * Errors are translated into plain language, and the technical detail is
 * collapsed rather than shouted. A raw revert string or a 500 tells the user
 * nothing useful and costs trust.
 */
export function ErrorState({
  error,
  context,
  onRetry,
  compact,
  className,
}: {
  error: unknown;
  /** Names the outcome, e.g. "Projects could not be loaded". */
  context?: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const parsed = parseError(error, context);

  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-danger-line bg-danger-subtle',
        compact ? 'px-3.5 py-3' : 'px-5 py-5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger-text" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium text-fg">{parsed.title}</p>
          <p className="mt-1 text-secondary text-fg-secondary">{parsed.message}</p>

          {parsed.raw && (
            <details className="mt-3 group">
              <summary className="cursor-pointer list-none text-meta text-fg-muted transition-colors hover:text-fg-secondary">
                View technical details
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-md border border-line bg-canvas p-3 text-code text-fg-muted">
                {parsed.raw}
              </pre>
            </details>
          )}

          {onRetry && parsed.retryable && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-4"
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

/* ----------------------------------------------------------------- alerts */

const ALERT_TONES = {
  info: 'border-info-line bg-info-subtle',
  warning: 'border-warning-line bg-warning-subtle',
  danger: 'border-danger-line bg-danger-subtle',
  success: 'border-success-line bg-success-subtle',
} as const;

export function Alert({
  tone = 'info',
  title,
  icon,
  children,
  className,
}: {
  tone?: keyof typeof ALERT_TONES;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-4 py-3', ALERT_TONES[tone], className)}
    >
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
        <div className="min-w-0 text-secondary">
          {title && <p className="font-medium text-fg">{title}</p>}
          <div className={cn(title && 'mt-1', 'text-fg-secondary')}>{children}</div>
        </div>
      </div>
    </div>
  );
}
