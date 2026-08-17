'use client';

import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/Badge';
import { TokenAmount } from '@/components/trust/Trust';
import { calculateFee, calculateNetAmount } from '@/chain/config';
import { formatDate, formatCountdown, formatTokenAmount } from '@/lib/format';
import { milestoneStatus } from '@/lib/status';
import { canCancelMilestone, type EscrowDetail, type Milestone } from '@/chain/escrow';
import { cn } from '@/lib/cn';

/**
 * The milestone ledger.
 *
 * Rows separated by hairlines rather than a grid of cards: a milestone is a
 * line item in a payment schedule, and reading it as one makes the schedule
 * comprehensible at a glance.
 *
 * Descriptions come from `escrow.getMilestones()`. The registry's
 * `getEscrowInfo()` appends " (Deadline: N days)" to every description, so
 * reading from there would show the deadline twice, once inside the title.
 *
 * The net figure is shown on every unreleased milestone, because the gross
 * amount is not what the developer receives and only showing gross would
 * overstate their payment by the fee on every screen.
 */

function DeadlineCell({ milestone }: { milestone: Milestone }) {
  if (milestone.deadline === 0n) {
    return <span className="text-meta text-fg-muted">No deadline</span>;
  }

  const date = formatDate(milestone.deadline);
  const remaining = formatCountdown(milestone.deadline);
  const settled = milestone.released || milestone.cancelled;

  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="text-meta text-fg-secondary">{date}</span>
      {!settled && (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-micro',
            remaining ? 'text-fg-muted' : 'text-warning-text',
          )}
        >
          {!remaining && <CalendarClock className="size-3" aria-hidden />}
          {remaining ? `${remaining} left` : 'Deadline passed'}
        </span>
      )}
    </span>
  );
}

export function MilestoneList({
  detail,
  canRelease,
  canCancel,
  busyIndex,
  onRelease,
  onCancel,
}: {
  detail: EscrowDetail;
  /** The connected wallet is the funder and the escrow is funded. */
  canRelease: boolean;
  canCancel: boolean;
  /** Index currently mid-transaction, or null. */
  busyIndex: number | null;
  onRelease: (milestone: Milestone) => void;
  onCancel: (milestone: Milestone) => void;
}) {
  return (
    <ol className="flex flex-col">
      {detail.milestones.map((milestone) => {
        const status = milestoneStatus(milestone);
        const settled = milestone.released || milestone.cancelled;
        const cancellable = canCancel && canCancelMilestone(milestone);
        const releasable = canRelease && !settled;
        const busy = busyIndex === milestone.index;

        return (
          <li
            key={milestone.index}
            className="flex flex-col gap-4 border-t border-line py-5 sm:flex-row sm:items-start sm:gap-6"
          >
            <span className="w-8 shrink-0 pt-0.5 font-mono text-code text-fg-muted tabular-nums">
              {String(milestone.index + 1).padStart(2, '0')}
            </span>

            <div className="min-w-0 flex-1">
              <p className={cn('text-body', settled ? 'text-fg-secondary' : 'text-fg')}>
                {milestone.description || `Milestone ${milestone.index + 1}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <StatusPill status={status} />
                <DeadlineCell milestone={milestone} />
              </div>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <TokenAmount amount={milestone.amount} token={detail.token} />
              {/* Named explicitly so the gross figure is never mistaken for
                  take-home pay. */}
              {!settled && (
                <p className="mt-1 text-micro text-fg-muted">
                  <span className="font-mono tabular-nums">
                    {formatTokenAmount(calculateNetAmount(milestone.amount), detail.token.decimals)}
                  </span>{' '}
                  to the developer after a{' '}
                  <span className="font-mono tabular-nums">
                    {formatTokenAmount(calculateFee(milestone.amount), detail.token.decimals)}
                  </span>{' '}
                  fee
                </p>
              )}
            </div>

            {(releasable || cancellable) && (
              <div className="flex shrink-0 gap-2 sm:pt-0.5">
                {releasable && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busy}
                    onClick={() => onRelease(milestone)}
                  >
                    Release
                  </Button>
                )}
                {cancellable && (
                  <Button size="sm" variant="ghost" onClick={() => onCancel(milestone)}>
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
