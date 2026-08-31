import { cn } from '@/lib/cn';

/**
 * How far through its milestones an escrow is.
 *
 * Three segments, because an escrow's money is always in exactly one of three
 * places and conflating them hides who is owed what:
 *
 *   released  — already paid to the developer (gross, before the fee)
 *   held      — still in the contract, committed to unreleased milestones
 *   returned  — cancelled milestones, already back with the funder
 *
 * A single "percent funded" bar would imply the middle segment is progress.
 * It is not: it is money nobody has yet.
 */
export function FundingProgress({
  total,
  released,
  held,
  className,
}: {
  total: bigint;
  /** Gross released. Matches the contract's `releasedAmount`. */
  released: bigint;
  /** Live contract balance. */
  held: bigint;
  className?: string;
}) {
  if (total <= 0n) return null;

  const pct = (value: bigint) => Number((value * 10_000n) / total) / 100;

  const releasedPct = Math.min(100, pct(released));
  const heldPct = Math.min(100 - releasedPct, pct(held));
  // Whatever is neither paid out nor still in the contract was refunded to
  // the funder by a cancellation. Derived rather than read, because the
  // contract does not track it separately.
  const returnedPct = Math.max(0, 100 - releasedPct - heldPct);

  // Announced in full, including the returned share — the legend names three
  // states, so a description that stops at two leaves a screen-reader user
  // unable to account for the remainder.
  const label = [
    `${Math.round(releasedPct)}% paid to the developer`,
    `${Math.round(heldPct)}% still held in escrow`,
    returnedPct > 0.5 ? `${Math.round(returnedPct)}% returned to the funder` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      // `h-2` rather than `h-1.5`. At 6px stretched across a 1000px content
      // column this had the proportions of a rule, and in a list whose rows are
      // already separated by hairlines it read as one more separator. Callers
      // are expected to constrain the width; the extra 2px is what stops it
      // disappearing into the page furniture when they do not.
      className={cn('flex h-2 w-full overflow-hidden rounded-full bg-subtle', className)}
      role="img"
      aria-label={label}
    >
      {releasedPct > 0 && (
        <span className="bg-success" style={{ width: `${releasedPct}%` }} aria-hidden />
      )}
      {heldPct > 0 && (
        <span className="bg-accent" style={{ width: `${heldPct}%` }} aria-hidden />
      )}
      {returnedPct > 0.5 && (
        <span className="bg-line-strong" style={{ width: `${returnedPct}%` }} aria-hidden />
      )}
    </div>
  );
}

/** The key for the bar above. Rendered once per page, not once per row. */
export function FundingProgressLegend({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      {[
        { tone: 'bg-success', label: 'Paid to the developer' },
        { tone: 'bg-accent', label: 'Held in escrow' },
        { tone: 'bg-line-strong', label: 'Returned to the funder' },
      ].map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-meta text-fg-muted">
          <span className={cn('size-2 rounded-full', item.tone)} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
