import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The hero visual: what an escrow looks like mid-flight.
 *
 * This is an **illustration**, and it is labelled as one on screen. It is not
 * live data and must never be mistaken for it — the figures are round numbers
 * chosen to make the arithmetic legible.
 *
 * The arithmetic itself is real, though: 1,200 × 1.5% = 18, leaving 1,182.
 * Showing the fee working correctly is the entire point of the picture, and a
 * made-up split would undermine the one thing it is trying to demonstrate.
 */

const MILESTONES = [
  { label: 'Design system and auth', amount: '1,200', state: 'released' as const },
  { label: 'Payments dashboard', amount: '2,400', state: 'held' as const },
  { label: 'Migration and handover', amount: '1,400', state: 'held' as const },
];

function Row({ milestone }: { milestone: (typeof MILESTONES)[number] }) {
  const released = milestone.state === 'released';

  return (
    <div className="flex items-center gap-3 border-t border-line py-3.5 first:border-t-0 first:pt-0">
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full',
          released
            ? 'bg-success-subtle text-success-text'
            : 'border border-line text-fg-muted',
        )}
        aria-hidden
      >
        {released ? <Check className="size-3" /> : <Lock className="size-2.5" />}
      </span>

      <span
        className={cn(
          'min-w-0 flex-1 truncate text-secondary',
          released ? 'text-fg-secondary' : 'text-fg',
        )}
      >
        {milestone.label}
      </span>

      <span className="shrink-0 font-mono text-code tabular-nums text-fg">
        {milestone.amount}
      </span>
    </div>
  );
}

export function EscrowIllustration({ className }: { className?: string }) {
  return (
    <figure className={cn('min-w-0', className)}>
      <div className="rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-lg)]">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-meta text-fg-muted">Held in escrow</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success-line bg-success-subtle px-2.5 py-0.5 text-micro font-medium text-success-text">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            Funded
          </span>
        </div>

        <p className="mt-2 font-mono text-title tabular-nums text-fg">
          3,800<span className="ml-1.5 text-heading text-fg-muted">tUSDC</span>
        </p>

        {/* Mirrors FundingProgress: paid, then still held. */}
        <div className="mt-5 flex h-1.5 w-full overflow-hidden rounded-full bg-subtle" aria-hidden>
          <span className="bg-success" style={{ width: '24%' }} />
          <span className="bg-accent" style={{ width: '76%' }} />
        </div>

        <div className="mt-6">
          {MILESTONES.map((milestone) => (
            <Row key={milestone.label} milestone={milestone} />
          ))}
        </div>

        {/* The fee, shown working. This is the number people actually want. */}
        <dl className="mt-6 rounded-lg border border-line bg-subtle px-4 py-3.5">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-meta text-fg-muted">Milestone released</dt>
            <dd className="font-mono text-code tabular-nums text-fg-secondary">1,200</dd>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <dt className="text-meta text-fg-muted">Platform fee (1.5%)</dt>
            <dd className="font-mono text-code tabular-nums text-fg-secondary">−18</dd>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-4 border-t border-line pt-2.5">
            <dt className="text-meta text-fg">Developer received</dt>
            <dd className="font-mono text-body tabular-nums text-fg">1,182</dd>
          </div>
        </dl>
      </div>

      {/* Stated plainly. Nothing on this page may be mistaken for live data. */}
      <figcaption className="mt-3 text-center text-micro text-fg-muted">
        Illustration. Not live data — the fee arithmetic is real.
      </figcaption>
    </figure>
  );
}
