import { ArrowRight, CircleCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Reveal } from '@/components/marketing/primitives/Reveal';
import { SectionHeading, MarketingSection } from '@/components/marketing/primitives/SectionHeading';
import { DEFAULT_CHAIN, PROTOCOL } from '@/chain/config';
import { feePercent } from '@/lib/format';

/**
 * The release, at full size.
 *
 * The hero shows the escrow at rest. This section shows the one moment that
 * matters — a funder releasing a milestone — because that is where the product
 * either earns trust or loses it, and it is the screen the whole contract
 * exists to reach.
 *
 * Composed asymmetrically and overlapping on purpose: the confirmation panel
 * sits on top of the ledger it came from, which is what it does in the product.
 * A side-by-side pair of equal boxes would describe the same two things and
 * imply no relationship between them.
 */

const FACTS = [
  ['Milestone', 'Payments dashboard'],
  ['Recipient', '0x8E13…799f'],
  ['Amount', '2,400.00 tUSDC'],
  [`Platform fee (${feePercent(PROTOCOL.feeBasisPoints)})`, '−36.00 tUSDC'],
];

export function Showcase() {
  return (
    <MarketingSection className="relative overflow-hidden border-t border-line">
      <SectionHeading
        eyebrow="The moment that matters"
        title="Nothing is signed before you have seen exactly what it does."
        lede="Every action that moves money states the amount, the recipient, the fee and the network first — and says plainly when it cannot be undone."
      />

      <div className="relative mt-16 lg:mt-20">
        {/* Ledger. Deliberately wider than the panel that sits on it, and
            offset left, so the composition has a direction. */}
        <Reveal y={16}>
          <div className="rounded-xl border border-line bg-surface shadow-[var(--shadow-lg)] lg:mr-32">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h3 className="truncate text-section text-fg">Payments platform rebuild</h3>
                <p className="mt-0.5 font-mono text-micro text-fg-muted">
                  Escrow · {DEFAULT_CHAIN.label}
                </p>
              </div>
              <span className="hidden shrink-0 rounded-full border border-accent-line bg-accent-subtle px-2.5 py-0.5 text-micro font-medium text-accent-text sm:inline">
                Funded
              </span>
            </div>

            <ol className="px-5 sm:px-6">
              {[
                { n: 1, t: 'Design system and authentication', a: '1,200.00', done: true },
                { n: 2, t: 'Payments dashboard', a: '2,400.00', done: false, active: true },
                { n: 3, t: 'Migration and handover', a: '1,400.00', done: false },
              ].map((m) => (
                <li
                  key={m.n}
                  className={cn(
                    'flex items-center gap-4 border-b border-line-faint py-4 last:border-b-0',
                    m.active && '-mx-3 rounded-lg bg-accent-subtle px-3',
                  )}
                >
                  <span className="w-5 shrink-0 font-mono text-micro tabular-nums text-fg-muted">
                    {String(m.n).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-secondary',
                      m.done ? 'text-fg-secondary' : 'text-fg',
                    )}
                  >
                    {m.t}
                  </span>
                  {m.done && (
                    <CircleCheck
                      className="size-3.5 shrink-0 text-success-text"
                      aria-hidden
                    />
                  )}
                  <span className="shrink-0 font-mono text-secondary tabular-nums text-fg">
                    {m.a}
                  </span>
                </li>
              ))}
            </ol>

            <div className="px-5 pb-5 sm:px-6 sm:pb-6" />
          </div>
        </Reveal>

        {/* The confirmation, overlapping. On small screens it stops overlapping
            and simply follows — an overlap that crushes the text beneath it is
            worse than no overlap. */}
        <Reveal
          delay={120}
          y={20}
          className="relative z-10 mx-auto mt-6 max-w-md lg:absolute lg:-bottom-14 lg:right-0 lg:mt-0 lg:w-[26rem]"
        >
          <div className="rounded-xl border border-line bg-elevated shadow-[var(--shadow-overlay)]">
            <div className="px-5 pt-5">
              <h4 className="text-section text-fg">Release milestone 2</h4>
              <p className="mt-1.5 text-secondary text-fg-secondary">
                The developer is paid immediately when this confirms.
              </p>
            </div>

            <dl className="mt-4 px-5">
              {FACTS.map(([label, value], i) => (
                <div
                  key={label}
                  className={cn(
                    'flex items-baseline justify-between gap-6 py-2.5',
                    i > 0 && 'border-t border-line-faint',
                  )}
                >
                  <dt className="shrink-0 text-meta text-fg-muted">{label}</dt>
                  <dd className="min-w-0 truncate font-mono text-meta tabular-nums text-fg">
                    {value}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-6 border-t border-line py-3">
                <dt className="shrink-0 text-secondary text-fg">Developer receives</dt>
                <dd className="font-mono text-section tabular-nums text-fg">2,364.00</dd>
              </div>
            </dl>

            <div className="mx-5 mb-4 flex items-start gap-2.5 rounded-lg border border-warning-line bg-warning-subtle px-3.5 py-2.5">
              <ShieldAlert
                className="mt-0.5 size-3.5 shrink-0 text-warning-text"
                aria-hidden
              />
              <p className="text-meta text-fg">This action cannot be undone.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-line bg-subtle px-5 py-3.5">
              {/* The real button material, at the real radius. A mock of the
                  product that renders the previous generation of its own
                  buttons is a picture of a screen that no longer exists. */}
              <span className="rounded-lg px-3 py-1.5 text-secondary text-fg-secondary">
                Cancel
              </span>
              <span className="of-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-secondary font-medium text-fg-on-accent">
                Release 2,364.00 tUSDC
                <ArrowRight className="size-3.5" aria-hidden />
              </span>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={80} className="mt-24 lg:mt-32">
        <p className="max-w-xl text-body text-fg-secondary">
          The button names the consequence and the figure, never &ldquo;Continue&rdquo;. The
          amount on it is what the developer actually receives — not the gross, which would
          overstate their payment on every screen it appeared.
        </p>
      </Reveal>
    </MarketingSection>
  );
}
