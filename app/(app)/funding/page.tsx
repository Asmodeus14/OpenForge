import type { Metadata } from 'next';
import Link from 'next/link';
import { HandCoins, Plus } from 'lucide-react';
import { Page, PageHeader, Section, Stat } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/States';
import { StatusPill } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { AddressDisplay, DisclosureNote, TokenAmount } from '@/components/trust/Trust';
import {
  FundingProgress,
  FundingProgressLegend,
} from '@/components/escrow/FundingProgress';
import { loadFunding } from '@/lib/server/escrows';
import { formatDate, formatTokenAmount } from '@/lib/format';
import { escrowState } from '@/lib/status';

export const metadata: Metadata = {
  title: 'Funding',
  description:
    'Every milestone escrow on OpenForge: who is funding what, how much is held, and how much has been paid out.',
};

/**
 * Public funding.
 *
 * Escrows are public contracts, so all of this is readable by anyone and none
 * of it needs a wallet. Making it a real page is the point: the mechanism only
 * builds trust if an outsider can check it, and until now the only way to see
 * an escrow was to be one of its two parties.
 *
 * Every figure comes from the contract. Where an escrow cannot be read, the
 * row says so instead of showing zero — a zero would be a claim, and the wrong
 * one.
 */
export const revalidate = 30;

export default async function FundingPage() {
  const { projects, activeCount, heldByToken, releasedByToken } = await loadFunding();

  const tokens = Array.from(
    new Set([...Object.keys(heldByToken), ...Object.keys(releasedByToken)]),
  );

  return (
    <Page>
      <PageHeader
        title="Funding"
        description="Every milestone escrow on this network. All of it is read from public contracts — no wallet required."
        actions={
          <Link href="/escrow/new" className={buttonClasses({ variant: 'primary' })}>
            <Plus className="size-4" aria-hidden />
            Fund a project
          </Link>
        }
      />

      {projects.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState
            icon={<HandCoins className="size-5" aria-hidden />}
            title="Nothing has been funded yet"
            description="No escrow has been deployed on this network. The first one created will appear here, along with who funded it and how much is held."
            action={
              <Link href="/escrow/new" className={buttonClasses({ variant: 'primary' })}>
                Create the first escrow
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <Section divided className="pb-2">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4">
              <Stat label="Escrows" value={projects.length} detail={`${activeCount} holding funds`} />
              {tokens.map((symbol) => (
                <Stat
                  key={`held-${symbol}`}
                  label={`Held in escrow (${symbol})`}
                  value={formatTokenAmount(
                    heldByToken[symbol]?.amount ?? 0n,
                    heldByToken[symbol]?.decimals ?? 18,
                  )}
                  detail="Committed, not yet paid"
                />
              ))}
              {tokens.map((symbol) => (
                <Stat
                  key={`released-${symbol}`}
                  label={`Paid out (${symbol})`}
                  value={formatTokenAmount(
                    releasedByToken[symbol]?.amount ?? 0n,
                    releasedByToken[symbol]?.decimals ?? 18,
                  )}
                  detail="Before the 1.5% fee"
                />
              ))}
            </dl>
          </Section>

          <Section title="Escrows" description="Newest first.">
            <FundingProgressLegend className="mb-7" />

            <ol className="flex flex-col">
              {projects.map(({ listing, escrow }) => (
                <li
                  key={listing.escrowAddress}
                  className="border-t border-line py-7 last:border-b"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/escrow/${listing.escrowAddress}`}
                        className="text-section text-fg hover:underline underline-offset-4"
                      >
                        {listing.title || `Escrow #${listing.projectId}`}
                      </Link>

                      {listing.description && (
                        <p className="mt-1.5 max-w-2xl text-secondary text-fg-secondary">
                          {listing.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="inline-flex items-center gap-2 text-meta text-fg-muted">
                          Funded by
                          <AddressDisplay address={listing.funder} showExplorer={false} />
                        </span>
                        <span className="inline-flex items-center gap-2 text-meta text-fg-muted">
                          Built by
                          <AddressDisplay address={listing.developer} showExplorer={false} />
                        </span>
                        <span className="text-meta text-fg-muted">
                          {formatDate(listing.createdAt) ?? ''}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      {escrow ? (
                        <>
                          <StatusPill status={escrowState(escrow.state)} />
                          <p className="mt-2.5">
                            <TokenAmount
                              amount={escrow.totalAmount}
                              token={escrow.token}
                              size="prominent"
                            />
                          </p>
                          <p className="mt-1 text-meta text-fg-muted">
                            {formatTokenAmount(escrow.releasedAmount, escrow.token.decimals)}{' '}
                            paid ·{' '}
                            {formatTokenAmount(escrow.contractBalance, escrow.token.decimals)}{' '}
                            held
                          </p>
                        </>
                      ) : (
                        <p className="text-meta text-warning-text">
                          This contract could not be read
                        </p>
                      )}
                    </div>
                  </div>

                  {escrow && escrow.totalAmount > 0n && (
                    <FundingProgress
                      className="mt-5"
                      total={escrow.totalAmount}
                      released={escrow.releasedAmount}
                      held={escrow.contractBalance}
                    />
                  )}
                </li>
              ))}
            </ol>

            <DisclosureNote className="mt-8">
              Amounts paid out are shown before the 1.5% platform fee, matching the figure
              the contract stores. The developer receives the amount minus that fee.
            </DisclosureNote>
          </Section>
        </>
      )}

      <div className="pb-16" />
    </Page>
  );
}
