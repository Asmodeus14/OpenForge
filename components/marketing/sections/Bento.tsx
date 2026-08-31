import type { ReactNode } from 'react';
import { CircleCheck, ExternalLink, Hash, Lock, ShieldCheck, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Reveal } from '@/components/marketing/primitives/Reveal';
import { SectionHeading, MarketingSection } from '@/components/marketing/primitives/SectionHeading';
import { DEFAULT_CHAIN, PROTOCOL } from '@/chain/config';
import { feePercent, formatDuration, shortenAddress } from '@/lib/format';

/**
 * The parts of the product that do not fit a linear story.
 *
 * A bento rather than a feature grid: the tiles are different sizes because the
 * things in them are different sizes. Seven identical cards would flatten a
 * signed proposal thread and a network badge into the same weight, and the
 * whole point of this layout is that they are not.
 */

function Tile({
  title,
  body,
  className,
  children,
}: {
  title: string;
  body: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'of-panel flex flex-col overflow-hidden rounded-2xl p-6',
        className,
      )}
    >
      <h3 className="text-section text-fg">{title}</h3>
      <p className="mt-2 text-secondary text-fg-secondary">{body}</p>
      {children && <div className="mt-6 flex-1">{children}</div>}
    </div>
  );
}

export function Bento() {
  return (
    <MarketingSection className="border-t border-line bg-subtle">
      <SectionHeading
        eyebrow="Under the surface"
        title="The details that decide whether this is trustworthy."
      />

      <div className="mt-16 grid gap-5 lg:mt-20 lg:grid-cols-3">
        {/* ---------------------------------------------- signed proposals */}
        <Reveal className="lg:col-span-2" y={16}>
          <Tile
            className="h-full"
            title="Terms are agreed in writing, then signed"
            body="An escrow usually starts as a conversation. The proposal is structured, the developer signs the exact figures, and the signature is checked against what is on screen before anything is deployed."
          >
            <div className="rounded-lg border border-line bg-canvas p-4">
              <div className="flex items-center gap-2.5">
                <span className="size-6 shrink-0 rounded-full bg-accent-subtle" aria-hidden />
                <span className="text-secondary font-medium text-fg">Escrow proposal</span>
                <span className="ml-auto rounded-full border border-success-line bg-success-subtle px-2 py-0.5 text-micro font-medium text-success-text">
                  Signed
                </span>
              </div>

              <dl className="mt-3.5 flex flex-col gap-1.5">
                {[
                  ['3 milestones', '5,000.00 tUSDC'],
                  ['Longest deadline', '60 days'],
                  ['Developer', shortenAddress('0x8E1371C3748709C924a1605aD850da7626B8799f', 4)],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4">
                    <dt className="text-meta text-fg-muted">{k}</dt>
                    <dd className="font-mono text-meta tabular-nums text-fg-secondary">{v}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3.5 flex items-center gap-2 border-t border-line pt-3 text-micro text-fg-muted">
                <CircleCheck className="size-3.5 shrink-0 text-success-text" aria-hidden />
                Signature verified against these exact terms
              </p>
            </div>
          </Tile>
        </Reveal>

        {/* -------------------------------------------------------- the fee */}
        <Reveal delay={80} y={16}>
          <Tile
            className="h-full"
            title="One fee, charged once"
            body={`${feePercent(PROTOCOL.feeBasisPoints)}, deducted the moment a milestone is released. Nothing is charged on a deposit, a refund, a cancellation or a dispute.`}
          >
            <dl className="flex flex-col gap-2">
              {[
                ['Milestone', '2,400.00'],
                [`Fee (${feePercent(PROTOCOL.feeBasisPoints)})`, '−36.00'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4">
                  <dt className="text-meta text-fg-muted">{k}</dt>
                  <dd className="font-mono text-meta tabular-nums text-fg-secondary">{v}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2.5">
                <dt className="text-secondary text-fg">To developer</dt>
                <dd className="font-mono text-section tabular-nums text-fg">2,364.00</dd>
              </div>
            </dl>
          </Tile>
        </Reveal>

        {/* ------------------------------------------------------- disputes */}
        <Reveal delay={40} y={16}>
          <Tile
            className="h-full"
            title="Disputes buy time, not verdicts"
            body={`Either side may raise one. It freezes reclaims for ${formatDuration(PROTOCOL.disputeWindowSeconds)} so there is room to settle, and then lapses on its own.`}
          >
            <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-4 py-3">
              <Lock className="size-4 shrink-0 text-fg-muted" aria-hidden />
              <span className="text-meta text-fg-secondary">Reclaim frozen</span>
              <span className="ml-auto font-mono text-meta tabular-nums text-fg">
                {formatDuration(PROTOCOL.disputeWindowSeconds)}
              </span>
            </div>
            <p className="mt-3 text-micro text-fg-muted">
              It awards nothing to anybody. The earlier contract let the funder resolve
              instantly while the developer waited a month — that asymmetry is gone.
            </p>
          </Tile>
        </Reveal>

        {/* -------------------------------------------------- verifiability */}
        <Reveal delay={80} y={16} className="lg:col-span-2">
          <Tile
            className="h-full"
            title="Every contract is readable before you trust it"
            body="Nothing is hidden behind an API. These are the deployed addresses this site talks to."
          >
            <ul className="flex flex-col">
              {[
                ['Escrow factory', DEFAULT_CHAIN.contracts.escrowFactory],
                ['Project registry', DEFAULT_CHAIN.contracts.projectRegistry],
                ['Profile registry', DEFAULT_CHAIN.contracts.profileRegistry],
              ].map(([label, address]) => (
                <li
                  key={address}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-line py-3 first:border-t-0 first:pt-0"
                >
                  <span className="text-meta text-fg-secondary">{label}</span>
                  <a
                    href={`${DEFAULT_CHAIN.explorer}/address/${address}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 font-mono text-micro text-accent-text hover:underline underline-offset-4"
                  >
                    {shortenAddress(address, 6)}
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </Tile>
        </Reveal>

        {/* ------------------------------------------------------- identity */}
        <Reveal delay={40} y={16}>
          <Tile
            className="h-full"
            title="No accounts"
            body="There is no sign-up, no password and no server-side profile of you. Your wallet is the identity, and everything else is public on chain or on IPFS."
          >
            <div className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas px-4 py-3">
              <Wallet className="size-4 shrink-0 text-fg-muted" aria-hidden />
              <span className="font-mono text-meta text-fg-secondary">0x8E13…799f</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-micro text-fg-muted">
                <span className="size-1.5 rounded-full bg-success" aria-hidden />
                {DEFAULT_CHAIN.name}
              </span>
            </div>
          </Tile>
        </Reveal>

        {/* ------------------------------------------------------- metadata */}
        <Reveal delay={80} y={16}>
          <Tile
            className="h-full"
            title="Descriptions live on IPFS"
            body="Milestone text is pinned rather than stored on chain. It cost a storage slot each and made fixing a typo a transaction."
          >
            <div className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas px-4 py-3">
              <Hash className="size-4 shrink-0 text-fg-muted" aria-hidden />
              <span className="truncate font-mono text-micro text-fg-secondary">
                bafkrei…q7fm
              </span>
            </div>
          </Tile>
        </Reveal>

        {/* --------------------------------------------------------- source */}
        <Reveal delay={120} y={16}>
          <Tile
            className="h-full"
            title="Deployed from published source"
            body="The factory builds every escrow from the same bytecode, so an escrow it did not create cannot appear in this product at all."
          >
            <div className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas px-4 py-3">
              <ShieldCheck className="size-4 shrink-0 text-success-text" aria-hidden />
              <span className="text-meta text-fg-secondary">Factory-deployed only</span>
            </div>
          </Tile>
        </Reveal>
      </div>
    </MarketingSection>
  );
}
