import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';
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
        <section className="mx-auto max-w-(--container-app) px-5 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-24">
          <p className="text-meta font-medium uppercase tracking-wide text-fg-muted">
            {DEFAULT_CHAIN.label} · prototype
          </p>

          <h1 className="mt-5 max-w-4xl text-hero text-fg">
            Fund open source work
            <br />
            one milestone at a time.
          </h1>

          <p className="mt-7 max-w-2xl text-lead text-fg-secondary">
            OpenForge puts a funder&rsquo;s money into a contract before the work starts, and
            pays it out only as each agreed milestone is approved. The developer can see the
            funds exist. The funder never pays for work that was not delivered.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/overview" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
              Open the app
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/discover" className={buttonClasses({ size: 'lg' })}>
              Browse projects
            </Link>
          </div>

          <p className="mt-8 max-w-2xl text-secondary text-fg-muted">
            This runs on {DEFAULT_CHAIN.label}. The tokens involved have no monetary value
            and are freely available from a faucet. Do not connect a wallet holding real
            funds.
          </p>
        </section>

        {/* --------------------------------------------------------- how it works */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-(--container-app) px-5 py-20 sm:px-8">
            <h2 className="text-display text-fg">How the escrow works</h2>

            <ol className="mt-14 flex flex-col">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="grid gap-3 border-t border-line py-9 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-8"
                >
                  <span className="font-mono text-code text-fg-muted tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="max-w-2xl">
                    <h3 className="text-section text-fg">{step.title}</h3>
                    <p className="mt-2.5 text-body text-fg-secondary">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
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
              {HONESTY.map((column) => (
                <div key={column.heading}>
                  <h3 className="text-section text-fg">{column.heading}</h3>
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
