import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Check, ExternalLink, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';
import { EscrowIllustration } from '@/components/marketing/EscrowIllustration';
import { DEFAULT_CHAIN, PROTOCOL } from '@/chain/config';
import { formatDuration } from '@/lib/format';

/**
 * The landing page.
 *
 * Every claim here is checkable. There are no visitor counts, no funding
 * totals, no "96% success rate", no invented testimonials and no logos of
 * companies that have never heard of this project — the previous version had
 * all of those, and none of the numbers came from anywhere.
 *
 * What is left is an explanation of the mechanism and an honest statement of
 * its limits. For a product asking people to lock money in a contract, that
 * is the only kind of persuasion worth having.
 */

export const metadata: Metadata = {
  title: 'OpenForge — milestone escrow for open source work',
  description:
    'Fund open source work through a contract that releases payment milestone by milestone. A prototype on the Sepolia test network.',
};

const STEPS = [
  {
    title: 'Agree the milestones',
    body: 'The funder and the developer settle on what will be delivered, what each piece is worth, and by when. This is written into the contract when it is deployed and can never be edited afterwards.',
  },
  {
    title: 'The funder deposits once',
    body: 'The whole amount moves into the escrow contract up front. The developer can see the money is there before starting, and the funder no longer has to be trusted to pay later.',
  },
  {
    title: 'Each milestone is released on approval',
    body: `When a piece of work is done, the funder releases that milestone and the developer is paid immediately. A ${Number(PROTOCOL.feeBasisPoints) / 100}% fee is deducted at that moment; nothing is charged at any other point.`,
  },
];

const HONESTY = [
  {
    heading: 'What the contract guarantees',
    points: [
      'The deposited amount is held by the contract, not by OpenForge. Nobody here can move it.',
      'Milestone amounts, deadlines and both wallet addresses are fixed at deployment and cannot be altered by anyone, including us.',
      'Every release, cancellation and dispute is a public transaction you can verify on a block explorer.',
      'The full source of the contract is in the repository and its bytecode matches what is deployed.',
    ],
  },
  {
    heading: 'What it does not',
    points: [
      'The funder holds the power. They alone decide when a milestone is released, and they can cancel unreleased milestones after their deadline and take that money back.',
      `Either side can raise a dispute, but the two are not equal: the funder can resolve one in their own favour immediately, while the developer must wait ${formatDuration(PROTOCOL.disputeTimeoutSeconds)}.`,
      'There is no arbitration, no appeal and no support team that can reverse anything.',
      'The contracts have not been audited.',
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader />

      <main id="main" className="flex-1">
        {/* ------------------------------------------------------------ hero */}
        <section className="relative overflow-hidden">
          {/* One soft accent wash behind the headline — the only decoration on
              the page, sitting behind content rather than competing with it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] opacity-60 [background:radial-gradient(58%_50%_at_50%_50%,var(--accent-subtle),transparent_70%)]"
          />

          <div className="relative mx-auto grid max-w-(--container-app) gap-14 px-5 pt-16 pb-20 sm:px-8 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:gap-16 lg:pb-28">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-subtle px-3 py-1 text-micro font-medium text-fg-secondary">
                <span className="size-1.5 rounded-full bg-success" aria-hidden />
                Live on {DEFAULT_CHAIN.label}
              </span>

              <h1 className="mt-6 text-hero text-fg">
                Fund open source work
                <br />
                one milestone at a time.
              </h1>

              <p className="mt-7 max-w-xl text-lead text-fg-secondary">
                The money goes into a contract before the work starts. The developer can see
                it is there. The funder releases it piece by piece, and only for work that
                was actually delivered.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/overview"
                  className={buttonClasses({ variant: 'primary', size: 'lg' })}
                >
                  Open the app
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link href="/funding" className={buttonClasses({ size: 'lg' })}>
                  See what&rsquo;s funded
                </Link>
              </div>

              <p className="mt-8 max-w-xl text-secondary text-fg-muted">
                Tokens on {DEFAULT_CHAIN.label} have no monetary value and come free from a
                faucet. Do not connect a wallet holding real funds.
              </p>
            </div>

            <EscrowIllustration className="lg:justify-self-end" />
          </div>
        </section>

        {/* --------------------------------------------------------- how it works */}
        <section className="border-t border-line bg-subtle">
          <div className="mx-auto max-w-(--container-app) px-5 py-20 sm:px-8 lg:py-24">
            <h2 className="max-w-2xl text-display text-fg">How the escrow works</h2>

            <ol className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex flex-col bg-canvas p-7">
                  <span
                    className="flex size-8 items-center justify-center rounded-full border border-line bg-subtle font-mono text-code tabular-nums text-fg-muted"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-section text-fg">{step.title}</h3>
                  <p className="mt-2.5 text-secondary text-fg-secondary">{step.body}</p>
                </li>
              ))}
            </ol>

            <p className="mt-8 max-w-2xl text-secondary text-fg-muted">
              Nothing here is held by OpenForge. The funds sit in a contract that only the
              two parties can act on, and every one of those actions is a public
              transaction.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ honesty */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-(--container-app) px-5 py-20 sm:px-8">
            <h2 className="text-display text-fg">What this actually does</h2>
            <p className="mt-4 max-w-2xl text-body text-fg-secondary">
              Escrow shifts risk; it does not remove it. Both halves of that are worth
              knowing before anyone deposits anything.
            </p>

            <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
              {HONESTY.map((column, columnIndex) => (
                <div key={column.heading}>
                  <h3 className="flex items-center gap-2.5 text-section text-fg">
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full',
                        columnIndex === 0
                          ? 'bg-success-subtle text-success-text'
                          : 'bg-warning-subtle text-warning-text',
                      )}
                      aria-hidden
                    >
                      {columnIndex === 0 ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Minus className="size-3.5" />
                      )}
                    </span>
                    {column.heading}
                  </h3>
                  <ul className="mt-6 flex flex-col">
                    {column.points.map((point) => (
                      <li
                        key={point}
                        className="border-t border-line py-4 text-body text-fg-secondary"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- contracts */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-(--container-app) px-5 py-20 sm:px-8">
            <h2 className="text-display text-fg">Verify it yourself</h2>
            <p className="mt-4 max-w-2xl text-body text-fg-secondary">
              These are the contracts this site talks to. Nothing is hidden behind an API —
              you can read every one of them on the block explorer without trusting anything
              on this page.
            </p>

            <dl className="mt-12 flex flex-col">
              {[
                {
                  label: 'Profile registry',
                  detail: `Wallet to profile. Enforces a ${formatDuration(PROTOCOL.profileUpdateCooldownSeconds)} cooldown between edits.`,
                  address: DEFAULT_CHAIN.contracts.profileRegistry,
                },
                {
                  label: 'Project registry',
                  detail: 'Project metadata, locked once a project leaves Draft.',
                  address: DEFAULT_CHAIN.contracts.projectRegistry,
                },
                {
                  label: 'Escrow registry',
                  detail: 'The index of deployed milestone escrows.',
                  address: DEFAULT_CHAIN.contracts.escrowRegistry,
                },
                {
                  label: 'Fee recipient',
                  detail: `Receives the ${Number(PROTOCOL.feeBasisPoints) / 100}% fee charged when a milestone is released. A fixed address, hardcoded in the contract.`,
                  address: PROTOCOL.feeRecipient,
                },
              ].map((row) => (
                <div
                  key={row.address}
                  className="flex flex-col gap-2 border-t border-line py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <div className="min-w-0 max-w-xl">
                    <dt className="text-body text-fg">{row.label}</dt>
                    <p className="mt-1 text-secondary text-fg-muted">{row.detail}</p>
                  </div>
                  <dd className="shrink-0">
                    <a
                      href={`${DEFAULT_CHAIN.explorer}/address/${row.address}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 break-all font-mono text-code text-accent-text hover:underline underline-offset-4"
                    >
                      {row.address}
                      <ExternalLink className="size-3 shrink-0" aria-hidden />
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* --------------------------------------------------------------- cta */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-(--container-app) px-5 py-24 sm:px-8">
            <h2 className="max-w-3xl text-display text-fg">
              Try it with test funds first.
            </h2>
            <p className="mt-4 max-w-2xl text-body text-fg-secondary">
              Everything here is free to exercise end to end — create a project, deploy an
              escrow, release a milestone, raise a dispute — using tokens that are worth
              nothing.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/escrow/new"
                className={buttonClasses({ variant: 'primary', size: 'lg' })}
              >
                Create an escrow
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/projects/new" className={buttonClasses({ size: 'lg' })}>
                Register a project
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
