import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';

/**
 * The heading rhythm every marketing section shares.
 *
 * Sections vary their composition deliberately — some are full-bleed, some are
 * asymmetric, some are sticky — but the entry into each one is constant, so
 * scrolling the page feels like chapters rather than like a series of separate
 * pages that happen to be stacked.
 *
 * `eyebrow` is not decoration. On a long page the reader arrives mid-scroll
 * with no idea where they are, and two words above the headline answer that
 * before the headline has to.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      <Reveal>
        <p className="text-micro font-medium uppercase tracking-[0.12em] text-accent-text">
          {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={60}>
        <h2 className="mt-4 text-balance text-display text-fg">{title}</h2>
      </Reveal>
      {lede && (
        <Reveal delay={120}>
          <p className="mt-5 text-balance text-lead text-fg-secondary">{lede}</p>
        </Reveal>
      )}
    </div>
  );
}

/** Vertical rhythm for a marketing section. Wider gutters than the app. */
export function MarketingSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('px-5 py-24 sm:px-8 sm:py-32', className)}>
      <div className="mx-auto max-w-(--container-app)">{children}</div>
    </section>
  );
}
