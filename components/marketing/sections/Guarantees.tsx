import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Reveal } from '@/components/marketing/primitives/Reveal';
import { SectionHeading, MarketingSection } from '@/components/marketing/primitives/SectionHeading';
import { PROTOCOL } from '@/chain/config';
import { formatDuration } from '@/lib/format';

/**
 * What the contract does, and what it does not.
 *
 * Carried over from the original landing page, which named the product's own
 * limits in plain language — the single most valuable thing on it. Marketing
 * pages almost never do this, which is exactly why it reads as credible.
 *
 * Set as two asymmetric columns rather than a matched pair. The limits column
 * is deliberately not smaller or quieter than the guarantees column: making the
 * bad news visually subordinate is a way of hiding it while appearing not to.
 */

const COLUMNS = [
  {
    heading: 'What the contract guarantees',
    tone: 'success' as const,
    points: [
      'The deposit is held by the contract, not by OpenForge. Nobody here can move it.',
      'Milestone amounts, deadlines and both wallet addresses are fixed at deployment and cannot be altered by anyone, including us.',
      'The funder cannot take a milestone back before its deadline. Until then the money is committed to the work.',
      'Every release, reclaim and dispute is a public transaction you can verify on a block explorer.',
      'Each escrow is deployed by the factory from published source, so the contract holding your money is the one in the repository.',
    ],
  },
  {
    heading: 'What it does not',
    tone: 'warning' as const,
    points: [
      'It cannot make anyone pay for work. Nothing on chain can judge whether a milestone was delivered, so the funder decides — and if they refuse, the money returns to them once the deadline passes.',
      `Either side can raise one dispute. It freezes reclaims for ${formatDuration(PROTOCOL.disputeWindowSeconds)} to create room to settle; it awards nothing to anybody.`,
      'There is no arbitration, no appeal, and no support team that can reverse anything.',
      'The contracts have not been audited.',
    ],
  },
];

export function Guarantees() {
  return (
    <MarketingSection className="border-t border-line">
      <SectionHeading
        eyebrow="Honestly"
        title="What this actually does — and what it cannot."
        lede="Both halves are worth knowing before anyone deposits anything."
      />

      <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-2 lg:gap-16">
        {COLUMNS.map((column, columnIndex) => (
          <Reveal key={column.heading} delay={columnIndex * 100}>
            <h3 className="flex items-center gap-3 text-section text-fg">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full',
                  column.tone === 'success'
                    ? 'bg-success-subtle text-success-text'
                    : 'bg-warning-subtle text-warning-text',
                )}
                aria-hidden
              >
                {column.tone === 'success' ? (
                  <Check className="size-4" />
                ) : (
                  <Minus className="size-4" />
                )}
              </span>
              {column.heading}
            </h3>

            <ul className="mt-7 flex flex-col">
              {column.points.map((point) => (
                <li
                  key={point}
                  className="border-t border-line py-5 text-body text-fg-secondary"
                >
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </MarketingSection>
  );
}
