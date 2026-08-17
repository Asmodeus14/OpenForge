import type { ReactNode } from 'react';
import { cn } from '../design/cn';

/**
 * Page heading.
 *
 * Hierarchy comes from typography and spacing rather than from a card or a
 * border — the page title should not need a box drawn around it to read as
 * the most important thing on screen.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-title text-fg">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-secondary text-fg-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
