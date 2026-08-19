'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Gavel, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { Divider, Page, PageHeader, Section, Stat } from '@/components/ui/Layout';
import { Alert, ErrorState, Skeleton, SkeletonText } from '@/components/ui/States';
import { StatusPill } from '@/components/ui/Badge';
import {
  AddressDisplay,
  DisclosureNote,
  TechnicalDetails,
  TokenAmount,
} from '@/components/trust/Trust';
import { Person } from '@/components/trust/Identity';
import { TransactionFlow } from '@/components/trust/TransactionFlow';
import { MilestoneList } from '@/components/escrow/MilestoneList';
import { DisputeDialog } from '@/components/escrow/DisputeDialog';
import { DisputeRoom } from '@/components/escrow/DisputeRoom';
import {
  fundEscrowIntent,
  raiseDisputeIntent,
  reclaimMilestonesIntent,
  releaseMilestonesIntent,
  sweepIntent,
  withdrawDisputeIntent,
} from '@/components/escrow/intents';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import {
  queryKeys,
  useAllEscrowProjects,
  useEscrow,
  useIpfsJson,
  useTokenAllowance,
  useTokenPermitSupport,
} from '@/hooks/queries';
import { useTransaction } from '@/hooks/useTransaction';
import {
  isReclaimable,
  permissionsFor,
  roleFor,
  sweepUnlocksAt,
  type Milestone,
} from '@/chain/escrow';
import { DEFAULT_CHAIN, PROTOCOL } from '@/chain/config';
import { formatCountdown, formatDate, formatDuration, isAddressEqual } from '@/lib/format';
import { milestoneNames, type EscrowMetadata } from '@/lib/escrow-metadata';
import { cn } from '@/lib/cn';
import {
  DISPUTE_FROZEN,
  EscrowState,
  OnChainMilestoneStatus,
  escrowState,
  isTerminalEscrowState,
} from '@/lib/status';

/**
 * One escrow, in full.
 *
 * Everything on this page is read from the contract itself. Nothing is
 * inferred, defaulted or padded: if a figure is not on chain it is not shown.
 * The only exception is the title and the milestone names, which are text on
 * IPFS — and the page renders completely without them.
 *
 * The action rail only offers what the connected wallet can actually do right
 * now — the contract's own rules, mirrored — so a user is never invited into a
 * transaction that will revert after they have paid for gas.
 */
export function EscrowDetailClient({ address }: { address: string }) {
  const wallet = useWalletContext();
  const queryClient = useQueryClient();

  const escrow = useEscrow(address);
  const detail = escrow.data;

  // The factory has no address→project view, so the listing comes from the
  // paginated index. It is one cached call, and the page is fully usable
  // without it.
  const registry = useAllEscrowProjects();
  const listing = registry.data?.find((p) => isAddressEqual(p.escrowAddress, address));
  const metadata = useIpfsJson<EscrowMetadata>(listing?.metadataCID);
  const names = milestoneNames(metadata.data);

  const role = detail ? roleFor(detail, wallet.account) : 'observer';
  const permissions = detail ? permissionsFor(detail, role) : null;

  const allowance = useTokenAllowance(
    detail?.paymentToken,
    wallet.account,
    permissions?.canFund ? address : null,
  );
  const permit = useTokenPermitSupport(
    permissions?.canFund ? detail?.paymentToken : null,
    wallet.account,
  );

  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [disputeOpen, setDisputeOpen] = useState(false);

  const tx = useTransaction({
    onSuccess: () => {
      setBusyIndex(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.escrow(address) });
      // Prefix match — a fund or approve changes the allowance for this
      // token/spender pair, and the exact key is not worth reconstructing.
      void queryClient.invalidateQueries({ queryKey: ['allowance'] });
    },
  });

  /* ------------------------------------------------------------ loading */

  if (escrow.isPending) {
    return (
      <Page>
        <PageHeader title="Escrow" eyebrow="Loading" />
        <div className="flex flex-col gap-6 border-t border-line py-10">
          <Skeleton className="h-20 w-full rounded-lg" />
          <SkeletonText lines={4} />
        </div>
      </Page>
    );
  }

  if (escrow.isError || !detail) {
    return (
      <Page width="content">
        <PageHeader title="Escrow" />
        <div className="border-t border-line py-10">
          <ErrorState
            error={escrow.error}
            context="This escrow could not be read"
            onRetry={() => void escrow.refetch()}
          />
          <p className="mt-5 text-secondary text-fg-secondary">
            This address may not be a MilestoneEscrow contract, or may not exist on{' '}
            {DEFAULT_CHAIN.label}.
          </p>
          <Link href="/escrow" className={cn(buttonClasses(), 'mt-6')}>
            <ArrowLeft className="size-4" aria-hidden />
            Back to escrows
          </Link>
        </div>
      </Page>
    );
  }

  const status = escrowState(detail.state);
  const settled = isTerminalEscrowState(detail.state);

  const pending = detail.milestones.filter(
    (m) => m.status === OnChainMilestoneStatus.Pending,
  );
  const remaining = pending.reduce((sum, m) => sum + m.amount, 0n);
  // `isReclaimable` rather than a second deadline comparison here: it is the
  // same predicate the contract enforces and the one `MilestoneList` uses for
  // its per-row button, so the batch action and the rows can never disagree
  // about which milestones are eligible.
  const overdue = pending.filter(isReclaimable);

  const disputeCountdown = detail.frozen ? formatCountdown(detail.disputeExpiresAt) : null;
  const raisedBy = detail.funderRaisedDispute
    ? detail.developerRaisedDispute
      ? 'both parties'
      : 'the funder'
    : 'the developer';

  /* ------------------------------------------------------------- actions */

  function release(milestone: Milestone) {
    setBusyIndex(milestone.index);
    tx.start(releaseMilestonesIntent(detail!, [milestone], names));
  }

  function reclaim(milestone: Milestone) {
    setBusyIndex(milestone.index);
    tx.start(reclaimMilestonesIntent(detail!, [milestone], names));
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Escrow"
        title={metadata.data?.title || 'Milestone escrow'}
        description={
          metadata.data?.description ||
          'A contract holding funds that are released milestone by milestone.'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={status} />
            {detail.frozen && <StatusPill status={DISPUTE_FROZEN} />}
          </div>
        }
      />

      {/* The state descriptor explains what the badge above actually means
          for the reader, rather than leaving a one-word label to do it. */}
      <div className="border-t border-line pt-6">
        <p className="text-body text-fg-secondary">{status.description}</p>
      </div>

      <Section divided={false} className="pt-8 pb-0">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4">
          <Stat
            label="Total in escrow"
            value={<TokenAmount amount={detail.totalAmount} token={detail.token} />}
            detail={`${detail.milestones.length} milestone${detail.milestones.length === 1 ? '' : 's'}`}
          />
          <Stat
            label="Released"
            value={<TokenAmount amount={detail.releasedGross} token={detail.token} />}
            // Gross, and said so. The developer received this minus the fee.
            detail="Before fees"
          />
          <Stat
            label="Still committed"
            value={<TokenAmount amount={remaining} token={detail.token} />}
            detail={`${pending.length} unsettled`}
          />
          <Stat
            label="Returned to funder"
            value={<TokenAmount amount={detail.reclaimedTotal} token={detail.token} />}
            detail="Reclaimed after deadline"
          />
        </dl>
      </Section>

      {/* -------------------------------------------------------- notices */}

      <div className="flex flex-col gap-3 pt-8">
        {detail.state === EscrowState.Created && (
          <Alert tone="warning" title="This escrow holds no funds yet">
            The contract exists but nothing has been deposited. No work is protected until it
            is funded.
          </Alert>
        )}

        {detail.frozen && (
          <Alert
            tone="warning"
            title="A dispute is open"
            icon={<ShieldAlert className="size-4 text-warning-text" aria-hidden />}
          >
            {/* Stated precisely, because the obvious reading of "disputed" —
                that everything is frozen — is wrong in the direction that
                matters. Payment is never blocked. */}
            The funder cannot reclaim overdue milestones while this is open, but can still
            release them. It moves no money and decides nothing on its own.
            <span className="mt-1 block text-meta text-fg-muted">
              Raised by {raisedBy} · lapses{' '}
              {disputeCountdown ? `in ${disputeCountdown}` : 'shortly'} (
              {formatDate(detail.disputeExpiresAt)})
            </span>
            {/* Offered to the two parties only. An observer has nothing to
                settle and should not be creating rooms about it. */}
            {role !== 'observer' && (
              <DisputeRoom
                escrowAddress={address}
                counterparty={role === 'funder' ? detail.developer : detail.funder}
                counterpartyRole={role === 'funder' ? 'developer' : 'funder'}
              />
            )}
          </Alert>
        )}

        {wallet.account && role === 'observer' && (
          <DisclosureNote>
            You are neither the funder nor the developer of this escrow, so you can view it
            but not act on it.
          </DisclosureNote>
        )}
      </div>

      {/* ------------------------------------------------------- parties */}

      <Section title="Parties" className="mt-2">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-meta text-fg-muted">Funder</dt>
            <dd className="mt-2 flex flex-wrap items-center gap-2">
              <Person address={detail.funder} chars={6} />
              {isAddressEqual(detail.funder, wallet.account) && (
                <span className="text-micro text-accent-text">You</span>
              )}
            </dd>
            <p className="mt-2 text-meta text-fg-muted">
              Deposits the funds and decides what to release. Can only take money back after
              a milestone&rsquo;s deadline passes unreleased.
            </p>
          </div>
          <div>
            <dt className="text-meta text-fg-muted">Developer</dt>
            <dd className="mt-2 flex flex-wrap items-center gap-2">
              <Person address={detail.developer} chars={6} />
              {isAddressEqual(detail.developer, wallet.account) && (
                <span className="text-micro text-accent-text">You</span>
              )}
            </dd>
            <p className="mt-2 text-meta text-fg-muted">
              Receives each milestone when the funder releases it. Cannot move funds, and can
              raise one dispute to freeze reclaims.
            </p>
          </div>
        </dl>
      </Section>

      {/* ---------------------------------------------------- milestones */}

      <Section
        title="Milestones"
        description={
          permissions?.canRelease
            ? 'Release a milestone only once you are satisfied the work is done. Releases cannot be reversed.'
            : 'Each milestone is paid only when the funder releases it.'
        }
      >
        {detail.milestones.length === 0 ? (
          <p className="py-6 text-body text-fg-secondary">
            This escrow was created with no milestones.
          </p>
        ) : (
          <MilestoneList
            detail={detail}
            names={names}
            canRelease={permissions?.canRelease ?? false}
            canReclaim={permissions?.canReclaim ?? false}
            busyIndex={tx.isBusy ? busyIndex : null}
            onRelease={release}
            onReclaim={reclaim}
          />
        )}

        {permissions?.canRelease && (
          <DisclosureNote className="mt-6">
            A {Number(detail.feeBps) / 100}% platform fee is deducted from each milestone when
            it is released. Nothing is charged on funds that come back to you.
          </DisclosureNote>
        )}

        {role === 'funder' && !settled && (
          <DisclosureNote className="mt-3">
            You can release any milestone at any time. You can only reclaim one after its
            deadline has passed without release — until then the money is committed, which is
            what makes this an escrow rather than a wallet.
          </DisclosureNote>
        )}

        {role === 'funder' && detail.frozen && overdue.length > 0 && (
          <DisclosureNote tone="caution" className="mt-3">
            {overdue.length} milestone{overdue.length === 1 ? ' is' : 's are'} past their
            deadline, but an open dispute freezes reclaims until{' '}
            {formatDate(detail.disputeExpiresAt)}. You can still release them.
          </DisclosureNote>
        )}
      </Section>

      {/* ------------------------------------------------------- actions */}

      {wallet.account && !settled && (role !== 'observer' || permissions?.canSweep) && (
        <Section title="Actions">
          <div className="flex flex-wrap gap-3">
            {permissions?.canFund && (
              <Button
                variant="primary"
                loading={allowance.isPending || permit.isPending}
                onClick={() =>
                  tx.start(
                    fundEscrowIntent(detail, allowance.data ?? 0n, permit.data ?? false),
                  )
                }
              >
                Fund this escrow
              </Button>
            )}

            {permissions?.canRelease && pending.length > 1 && (
              <Button
                variant="secondary"
                onClick={() => tx.start(releaseMilestonesIntent(detail, pending, names))}
              >
                Release all {pending.length} remaining
              </Button>
            )}

            {permissions?.canReclaim && overdue.length > 1 && (
              <Button
                variant="ghost"
                onClick={() => tx.start(reclaimMilestonesIntent(detail, overdue, names))}
              >
                Reclaim {overdue.length} overdue
              </Button>
            )}

            {permissions?.canRaiseDispute && (
              <Button
                variant="secondary"
                leadingIcon={<Gavel className="size-4" aria-hidden />}
                onClick={() => setDisputeOpen(true)}
              >
                Raise a dispute
              </Button>
            )}

            {permissions?.canWithdrawDispute && (
              <Button variant="ghost" onClick={() => tx.start(withdrawDisputeIntent(detail))}>
                Withdraw dispute
              </Button>
            )}

            {permissions?.canSweep && (
              <Button variant="ghost" onClick={() => tx.start(sweepIntent(detail))}>
                Close and return funds to the funder
              </Button>
            )}
          </div>

          {role === 'developer' && (
            <DisclosureNote tone="caution" className="mt-6">
              There is no arbitrator. Nothing on chain can judge whether you delivered, so the
              funder cannot be forced to release a milestone — if they refuse, the money
              returns to them once the deadline passes. What this contract does guarantee is
              that the funds exist, and that they cannot be withdrawn before then.
            </DisclosureNote>
          )}

          {role === 'funder' && detail.state === EscrowState.Funded && (
            <DisclosureNote className="mt-6">
              Anything still unsettled {formatDuration(PROTOCOL.sweepGraceSeconds)} after the
              last deadline ({formatDate(sweepUnlocksAt(detail))}) can be returned to you by
              anyone, so funds cannot be stranded here.
            </DisclosureNote>
          )}
        </Section>
      )}

      {settled && (
        <Section title="Closed">
          <p className="text-body text-fg-secondary">
            {status.description} No further action is possible on this contract.
          </p>
        </Section>
      )}

      {/* ----------------------------------------------------- technical */}

      <Divider />
      <div className="py-10">
        <TechnicalDetails summary="Contract details">
          <dl className="flex flex-col gap-4">
            <div>
              <dt className="text-meta text-fg-muted">Escrow contract</dt>
              <dd className="mt-1.5">
                <AddressDisplay address={detail.address} chars={8} />
              </dd>
            </div>
            <div>
              <dt className="text-meta text-fg-muted">
                Payment token — {detail.token.name} ({detail.token.decimals} decimals)
              </dt>
              <dd className="mt-1.5">
                <AddressDisplay address={detail.paymentToken} chars={8} />
              </dd>
            </div>
            <div>
              {/* Read from this escrow, not from the app's constants — the
                  interface must never quote a fee the contract will not take. */}
              <dt className="text-meta text-fg-muted">
                Fee recipient — {Number(detail.feeBps) / 100}% on release
              </dt>
              <dd className="mt-1.5">
                <AddressDisplay address={detail.feeRecipient} chars={8} />
              </dd>
            </div>
            <div>
              <dt className="text-meta text-fg-muted">Held by contract</dt>
              <dd className="mt-1.5">
                <TokenAmount amount={detail.contractBalance} token={detail.token} />
              </dd>
            </div>
            {listing?.metadataCID && (
              <div>
                <dt className="text-meta text-fg-muted">Project metadata</dt>
                <dd className="mt-1.5 font-mono text-code break-all text-fg-secondary">
                  {listing.metadataCID}
                </dd>
              </div>
            )}
          </dl>
        </TechnicalDetails>
      </div>

      <DisputeDialog
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        role={role === 'developer' ? 'developer' : 'funder'}
        onSubmit={(reason) =>
          tx.start(raiseDisputeIntent(detail, reason, role === 'developer' ? 'developer' : 'funder'))
        }
      />

      <TransactionFlow tx={tx} />
    </Page>
  );
}
