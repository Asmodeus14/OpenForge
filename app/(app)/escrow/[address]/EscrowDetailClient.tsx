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
import { TransactionFlow } from '@/components/trust/TransactionFlow';
import { MilestoneList } from '@/components/escrow/MilestoneList';
import { DisputeDialog } from '@/components/escrow/DisputeDialog';
import {
  cancelMilestoneIntent,
  cancelProjectIntent,
  fundEscrowIntent,
  raiseDisputeIntent,
  releaseMilestoneIntent,
  resolveToDeveloperIntent,
  resolveToFunderIntent,
} from '@/components/escrow/intents';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import {
  queryKeys,
  useAllEscrowProjects,
  useEscrow,
  useTokenAllowance,
} from '@/hooks/queries';
import { useTransaction } from '@/hooks/useTransaction';
import { permissionsFor, roleFor, type Milestone } from '@/chain/escrow';
import { DEFAULT_CHAIN, PROTOCOL } from '@/chain/config';
import { formatCountdown, formatDate, formatDuration, isAddressEqual } from '@/lib/format';
import { cn } from '@/lib/cn';
import { EscrowState, escrowState, isTerminalEscrowState } from '@/lib/status';

/**
 * One escrow, in full.
 *
 * Everything on this page is read from the contract itself. Nothing is
 * inferred, defaulted or padded: if a figure is not on chain it is not shown.
 *
 * The action rail only offers what the connected wallet can actually do right
 * now — the contract's own rules, mirrored — so a user is never invited into
 * a transaction that will revert after they have paid for gas.
 */
export function EscrowDetailClient({ address }: { address: string }) {
  const wallet = useWalletContext();
  const queryClient = useQueryClient();

  const escrow = useEscrow(address);
  const detail = escrow.data;

  // The registry has no address→project lookup, so the title comes from the
  // paginated listing. It is one cached call, and the page is fully usable
  // without it.
  const registry = useAllEscrowProjects();
  const listing = registry.data?.find((p) => isAddressEqual(p.escrowAddress, address));

  const role = detail ? roleFor(detail, wallet.account) : 'observer';
  const permissions = detail ? permissionsFor(detail, role) : null;

  const allowance = useTokenAllowance(
    detail?.paymentToken,
    wallet.account,
    permissions?.canFund ? address : null,
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
            This address may not be a SimpleMilestoneEscrow contract, or may not exist on{' '}
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
  const remaining = detail.milestones
    .filter((m) => !m.released && !m.cancelled)
    .reduce((sum, m) => sum + m.amount, 0n);

  const disputeUnlock = permissions?.disputeUnlocksAt;
  const disputeCountdown = disputeUnlock ? formatCountdown(disputeUnlock) : null;

  /* ------------------------------------------------------------- actions */

  function release(milestone: Milestone) {
    setBusyIndex(milestone.index);
    tx.start(releaseMilestoneIntent(detail!, milestone));
  }

  function cancel(milestone: Milestone) {
    setBusyIndex(milestone.index);
    tx.start(cancelMilestoneIntent(detail!, milestone));
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Escrow"
        title={listing?.title || 'Milestone escrow'}
        description={
          listing?.description ||
          'A contract holding funds that are released milestone by milestone.'
        }
        actions={<StatusPill status={status} />}
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
            value={<TokenAmount amount={detail.releasedAmount} token={detail.token} />}
            // The contract accumulates gross here while the event reports net.
            // Saying which one this is prevents the two being read as equal.
            detail="Before fees"
          />
          <Stat
            label="Still committed"
            value={<TokenAmount amount={remaining} token={detail.token} />}
            detail="Unreleased milestones"
          />
          <Stat
            label="Held by contract"
            value={<TokenAmount amount={detail.contractBalance} token={detail.token} />}
            detail="Live token balance"
          />
        </dl>
      </Section>

      {/* -------------------------------------------------------- notices */}

      <div className="flex flex-col gap-3 pt-8">
        {detail.state === EscrowState.Created && (
          <Alert tone="warning" title="This escrow holds no funds yet">
            The contract is deployed but nothing has been deposited. No work is protected
            until it is funded.
          </Alert>
        )}

        {detail.state === EscrowState.Disputed && (
          <Alert
            tone="danger"
            title="A dispute is open"
            icon={<ShieldAlert className="size-4 text-danger-text" aria-hidden />}
          >
            Milestone releases are paused. The funder can end this in their own favour at
            any time.{' '}
            {disputeCountdown
              ? `The developer can claim the remaining balance in ${disputeCountdown}.`
              : 'The developer can now also claim the remaining balance.'}
            {disputeUnlock && (
              <span className="mt-1 block text-meta text-fg-muted">
                Raised {formatDate(detail.disputeRaisedAt)} · developer unlocked{' '}
                {formatDate(disputeUnlock)}
              </span>
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
              <AddressDisplay address={detail.funder} chars={6} />
              {isAddressEqual(detail.funder, wallet.account) && (
                <span className="text-micro text-accent-text">You</span>
              )}
            </dd>
            <p className="mt-2 text-meta text-fg-muted">
              Deposits the funds. Solely controls releases, milestone cancellation and
              cancelling the project.
            </p>
          </div>
          <div>
            <dt className="text-meta text-fg-muted">Developer</dt>
            <dd className="mt-2 flex flex-wrap items-center gap-2">
              <AddressDisplay address={detail.developer} chars={6} />
              {isAddressEqual(detail.developer, wallet.account) && (
                <span className="text-micro text-accent-text">You</span>
              )}
            </dd>
            <p className="mt-2 text-meta text-fg-muted">
              Receives each milestone when the funder releases it. Cannot move funds, and
              can only raise a dispute.
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
            This escrow was deployed with no milestones.
          </p>
        ) : (
          <MilestoneList
            detail={detail}
            canRelease={permissions?.canRelease ?? false}
            canCancel={permissions?.canCancelMilestone ?? false}
            busyIndex={tx.isBusy ? busyIndex : null}
            onRelease={release}
            onCancel={cancel}
          />
        )}

        {permissions?.canRelease && (
          <DisclosureNote className="mt-6">
            A {Number(PROTOCOL.feeBasisPoints) / 100}% platform fee is deducted from each
            milestone when it is released and sent to a fixed address. No fee is charged on
            cancellation or dispute resolution.
          </DisclosureNote>
        )}

        {permissions?.canCancelMilestone && (
          <DisclosureNote className="mt-3">
            A milestone can only be cancelled after its deadline has passed. Milestones
            without a deadline can never be cancelled individually.
          </DisclosureNote>
        )}
      </Section>

      {/* ------------------------------------------------------- actions */}

      {wallet.account && role !== 'observer' && !settled && (
        <Section title="Actions">
          <div className="flex flex-wrap gap-3">
            {permissions?.canFund && (
              <Button
                variant="primary"
                loading={allowance.isPending}
                onClick={() => tx.start(fundEscrowIntent(detail, allowance.data ?? 0n))}
              >
                Fund this escrow
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

            {permissions?.canResolveToFunder && (
              <Button variant="danger" onClick={() => tx.start(resolveToFunderIntent(detail))}>
                Return remaining funds to me
              </Button>
            )}

            {permissions?.canCancelProject && (
              <Button variant="ghost" onClick={() => tx.start(cancelProjectIntent(detail))}>
                Cancel project
              </Button>
            )}

            {role === 'developer' && detail.state === EscrowState.Disputed && (
              <Button
                variant="secondary"
                disabled={!permissions?.canResolveToDeveloper}
                onClick={() => tx.start(resolveToDeveloperIntent(detail))}
              >
                {permissions?.canResolveToDeveloper
                  ? 'Claim remaining funds'
                  : `Claim available in ${disputeCountdown ?? formatDuration(PROTOCOL.disputeTimeoutSeconds)}`}
              </Button>
            )}
          </div>

          {role === 'developer' && (
            <DisclosureNote tone="caution" className="mt-6">
              As the developer you cannot release, cancel or withdraw. Raising a dispute
              pauses releases, but the funder can end it in their own favour immediately
              while you must wait {formatDuration(PROTOCOL.disputeTimeoutSeconds)}.
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
              <dt className="text-meta text-fg-muted">
                Fee recipient — {Number(PROTOCOL.feeBasisPoints) / 100}% on release
              </dt>
              <dd className="mt-1.5">
                <AddressDisplay address={PROTOCOL.feeRecipient} chars={8} />
              </dd>
            </div>
            <div>
              <dt className="text-meta text-fg-muted">Fees collected to date</dt>
              <dd className="mt-1.5">
                <TokenAmount amount={detail.totalFeesCollected} token={detail.token} />
              </dd>
            </div>
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
