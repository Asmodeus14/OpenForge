import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Layout primitives.
 *
 * These exist to make the *default* way of building a page be sections
 * separated by whitespace and hairlines, rather than a grid of bordered
 * boxes. Reaching for `Card` should be a deliberate choice, made when
 * grouping genuinely aids comprehension.
 */

export function Page({
  width = 'app',
  className,
  children,
}: {
  width?: 'content' | 'app' | 'wide';
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-8',
        width === 'content' && 'max-w-(--container-content)',
        width === 'app' && 'max-w-(--container-app)',
        width === 'wide' && 'max-w-(--container-wide)',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Small label above the title — breadcrumb-ish context, used sparingly. */
  eyebrow?: string;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-6 pt-10 pb-8', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-micro font-medium uppercase tracking-wide text-fg-muted">
            {eyebrow}
          </p>
        )}
        <h1 className="text-title text-fg">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-body text-fg-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </header>
  );
}

/**
 * A page section. Whitespace and a hairline separate it from its neighbours —
 * no border box.
 */
export function Section({
  title,
  description,
  actions,
  divided = true,
  className,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  /** Draws the hairline above the section. */
  divided?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(divided && 'border-t border-line', 'py-10', className)}>
      {(title || actions) && (
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <div className="min-w-0">
            {title && <h2 className="text-section text-fg">{title}</h2>}
            {description && (
              <p className="mt-1.5 max-w-xl text-secondary text-fg-secondary">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * A single figure with a label.
 *
 * Deliberately not boxed. A row of these separated by whitespace reads as a
 * summary; the same numbers in six bordered cards reads as an admin panel.
 */
export function Stat({
  label,
  value,
  detail,
  as: As = 'div',
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  as?: ElementType;
  className?: string;
}) {
  return (
    <As className={cn('min-w-0', className)}>
      <dt className="text-meta text-fg-muted">{label}</dt>
      <dd className="mt-1.5 text-heading tabular-nums text-fg">{value}</dd>
      {detail && <p className="mt-1 text-meta text-fg-muted">{detail}</p>}
    </As>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-line', className)} />;
}

/**
 * A bordered container. Use only where grouping actually helps — a single
 * milestone, a transaction summary — not as the default wrapper.
 */
export function Card({
  interactive,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        // Glass, weighted for reading. The environment behind the application
        // shows through enough that a card reads as a pane sitting on the sky,
        // and not so much that an address or an amount becomes hard work.
        'of-glass-panel rounded-2xl',
        interactive &&
          'transition-[border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-line-strong hover:shadow-[var(--shadow-lg)]',
        className,
      )}
      {...props}
    />
  );
}
