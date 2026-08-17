import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover affordance. Only use when the whole card is clickable. */
  interactive?: boolean;
}

export function Card({ interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line bg-surface',
        interactive &&
          'transition-colors duration-[var(--dur-hover)] hover:border-line-strong hover:bg-raised',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-line px-4 py-3',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-section text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-meta text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t border-line px-4 py-3',
        className,
      )}
      {...props}
    />
  );
}
