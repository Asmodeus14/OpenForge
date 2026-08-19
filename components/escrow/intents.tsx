import { createElement } from 'react';
import {
  approveToken,
  fundEscrow,
  fundEscrowWithPermit,
  raiseDispute,
  reclaimMilestones,
  releaseMilestones,
  sweepEscrow,
  withdrawDispute,
  type EscrowDetail,
  type Milestone,
} from '@/chain/escrow';
import { createEscrow, type CreateEscrowParams } from '@/chain/escrowFactory';
import { signPermit } from '@/chain/erc20';
import { DEFAULT_CHAIN, PROTOCOL, type TokenInfo } from '@/chain/config';
import { formatTokenAmount, formatDuration, formatDate, shortenAddress } from '@/lib/format';
import { AddressDisplay, TokenAmount } from '@/components/trust/Trust';
import type { TxIntent } from '@/hooks/useTransaction';

/**
 * Escrow transaction intents.
 *
 * Kept beside the contract calls they describe, so the facts a user is shown
 * cannot drift away from what the transaction actually does. Every intent
 * states the amount, the recipient, the fee and the consequence before a wallet
 * is ever opened.
 *
 * Facts are built with the same `TokenAmount` and `AddressDisplay` components
 * the pages use, so a figure in a confirmation dialog is produced by identical
 * code to the figure on the page behind it.
 *
 * The disclosures here changed substantially with the v2 contract, because what
 * they had to disclose changed. They used to warn that the funder could cancel
 * the project and take back every unreleased token at any moment, and that the
 * funder could win any dispute instantly while the developer waited thirty
 * days. Both of those powers are gone, so the copy describing them would now be
 * a lie in the opposite direction — claiming a danger that no longer exists is
 * as inaccurate as hiding one that does.
 */

const amountFact = (label: string, amount: bigint, detail: EscrowDetail, emphasis = false) => ({
  label,
  value: createElement(TokenAmount, {
    amount,
    token: detail.token,
    size: emphasis ? ('prominent' as const) : ('inline' as const),
  }),
  emphasis,
});

const addressFact = (label: string, address: string) => ({
  label,
  value: createElement(AddressDisplay, { address, chars: 6, showExplorer: false }),
});

const networkFact = () => ({ label: 'Network', value: DEFAULT_CHAIN.label });

/**
 * Fee for a set of milestones, using this escrow's own rate.
 *
 * Summed per milestone rather than taken on the total, because the contract
 * charges each release separately and Solidity's division truncates. On a
 * 6-decimal token the two methods can differ, and the figure shown must be the
 * one the contract will actually take.
 */
export function totalFeeFor(amounts: bigint[], feeBps: bigint): bigint {
  return amounts.reduce((sum, amount) => sum + (amount * feeBps) / 10_000n, 0n);
}

const feePercent = (feeBps: bigint) => `${Number(feeBps) / 100}%`;

const milestoneLabel = (milestone: Milestone, names?: Record<number, string>) =>
  names?.[milestone.index] || `Milestone ${milestone.index + 1}`;

/**
 * Release one or more milestones.
 *
 * The button names the NET total, because that is what the developer actually
 * receives — the gross figure would overstate it by the fee.
 *
 * Batched because approving three finished milestones used to cost three
 * transactions.
 */
export function releaseMilestonesIntent(
  detail: EscrowDetail,
  milestones: Milestone[],
  names?: Record<number, string>,
): TxIntent {
  const amounts = milestones.map((m) => m.amount);
  const gross = amounts.reduce((sum, amount) => sum + amount, 0n);
  const fee = totalFeeFor(amounts, detail.feeBps);
  const net = gross - fee;
  const netLabel = `${formatTokenAmount(net, detail.token.decimals)} ${detail.token.symbol}`;
  const many = milestones.length > 1;

  return {
    title: many ? `Release ${milestones.length} milestones` : `Release ${milestoneLabel(milestones[0], names)}`,
    actionLabel: `Release ${netLabel}`,
    irreversible: true,
    facts: [
      {
        label: many ? 'Milestones' : 'Milestone',
        value: milestones.map((m) => milestoneLabel(m, names)).join(', '),
      },
      addressFact('Recipient', detail.developer),
      amountFact(many ? 'Total amount' : 'Milestone amount', gross, detail),
      amountFact(`Platform fee (${feePercent(detail.feeBps)})`, fee, detail),
      amountFact('Developer receives', net, detail, true),
      networkFact(),
    ],
    disclosures: [
      `A ${feePercent(detail.feeBps)} platform fee is deducted on release and sent to ${shortenAddress(detail.feeRecipient)}. Nothing is charged when funds go back to you.`,
      'Released funds cannot be recalled. Only release a milestone once you are satisfied the work is complete.',
    ],
    failureReassurance: 'Your funds have NOT been released.',
    successSummary: `${netLabel} was sent to ${shortenAddress(detail.developer)}.`,
    steps: [
      {
        label: `Release ${netLabel}`,
        kind: 'send',
        description: 'Transfers the milestone rewards and pays the platform fee.',
        run: (signer) =>
          releaseMilestones(
            signer,
            detail.address,
            milestones.map((m) => m.index),
          ),
      },
    ],
  };
}

export interface CreateEscrowIntentInput {
  params: CreateEscrowParams;
  token: TokenInfo;
  title: string;
  /** Set when the token supports EIP-2612, which removes a whole transaction. */
  canPermit: boolean;
  /** Current allowance the token grants. Approval is skipped where it already
   *  covers the total, so the user is not asked to sign needlessly. */
  existingAllowance: bigint;
  /** Receives the deployed address as soon as it is known, so the caller can
   *  navigate to it even if a later step fails. */
  onDeployed?: (address: string) => void;
}

/**
 * Create the escrow and fund it, as visible steps.
 *
 * This was four transactions: deploy, register, approve, deposit. The factory
 * deploys and indexes in one, and EIP-2612 collapses approve and deposit into
 * one more, so a permit-capable token now takes two — plus a signature, which
 * costs nothing and moves nothing on its own.
 */
export function createEscrowIntent(input: CreateEscrowIntentInput): TxIntent {
  const { params, token, existingAllowance, canPermit } = input;

  const amounts = params.milestones.map((m) => m.amount);
  const total = amounts.reduce((sum, amount) => sum + amount, 0n);
  const fee = totalFeeFor(amounts, PROTOCOL.feeBasisPoints);
  const net = total - fee;
  const totalLabel = `${formatTokenAmount(total, token.decimals)} ${token.symbol}`;

  const alreadyApproved = existingAllowance >= total;
  const usePermit = canPermit && !alreadyApproved;

  const lastDeadline = params.milestones.reduce(
    (max, m) => (m.deadline > max ? m.deadline : max),
    0n,
  );

  // Assigned by the first step and read by the ones after it. The address is
  // only knowable once the factory has actually deployed.
  let escrowAddress = '';

  const steps: TxIntent['steps'] = [
    {
      label: 'Create the escrow',
      kind: 'deploy',
      description:
        'Deploys the contract that will hold the funds and lists it, in one transaction. No tokens move yet.',
      run: async (signer) => {
        const { address, tx } = await createEscrow(signer, params);
        escrowAddress = address;
        input.onDeployed?.(address);
        return tx;
      },
    },
  ];

  if (usePermit) {
    // Held between the signing step and the deposit step that consumes it.
    let permit: Awaited<ReturnType<typeof signPermit>> | undefined;

    steps.push(
      {
        label: `Authorise ${totalLabel}`,
        kind: 'sign',
        description:
          'A signature, not a transaction. It costs no gas and moves nothing by itself.',
        run: async (signer) => {
          permit = await signPermit(signer, params.token, escrowAddress, total);
        },
      },
      {
        label: `Deposit ${totalLabel}`,
        kind: 'send',
        description: 'Applies the authorisation and transfers the full amount into the escrow.',
        run: (signer) => {
          if (!permit) throw new Error('The authorisation signature is missing.');
          return fundEscrowWithPermit(signer, escrowAddress, permit);
        },
      },
    );
  } else {
    if (!alreadyApproved) {
      steps.push({
        label: `Approve ${totalLabel}`,
        kind: 'approve',
        description:
          'Permits the escrow contract to move this amount. It does not transfer anything.',
        run: (signer) => approveToken(signer, params.token, escrowAddress, total),
      });
    }
    steps.push({
      label: `Deposit ${totalLabel}`,
      kind: 'send',
      description: 'Transfers the full amount into the escrow contract.',
      run: (signer) => fundEscrow(signer, escrowAddress),
    });
  }

  const txCount = steps.filter((step) => step.kind !== 'sign').length;

  return {
    title: 'Create and fund an escrow',
    actionLabel: `Deposit ${totalLabel}`,
    irreversible: true,
    facts: [
      { label: 'Project', value: input.title },
      addressFact('Developer', params.developer),
      { label: 'Token', value: `${token.symbol} — ${token.name}` },
      { label: 'Milestones', value: String(params.milestones.length) },
      { label: 'Last deadline', value: formatDate(lastDeadline) },
      {
        label: 'Total deposited',
        value: createElement(TokenAmount, { amount: total, token, size: 'prominent' as const }),
        emphasis: true,
      },
      {
        label: 'Platform fee if all released',
        value: createElement(TokenAmount, { amount: fee, token }),
      },
      {
        label: 'Developer receives if all released',
        value: createElement(TokenAmount, { amount: net, token }),
      },
      networkFact(),
    ],
    disclosures: [
      usePermit
        ? `This takes ${txCount} transactions and one signature, in this order. Each transaction costs a network fee in ${DEFAULT_CHAIN.nativeSymbol}; the signature is free.`
        : `This takes ${txCount} wallet confirmations, in this order. Each costs a network fee in ${DEFAULT_CHAIN.nativeSymbol}.`,
      'You are the funder. You can release any milestone at any time — paying is never blocked.',
      "You can only take a milestone's funds back once its deadline has passed without you releasing it. Until then the money is committed, and that commitment is the whole point of an escrow.",
      `A ${feePercent(PROTOCOL.feeBasisPoints)} fee is deducted from each milestone as it is released. Nothing is charged on funds returned to you.`,
      'There is no arbitrator. Nothing on chain can judge whether work was delivered, so this contract cannot force you to pay for work you dispute — and cannot force the developer to be paid for work you refuse.',
    ],
    failureReassurance: 'No escrow was created and no funds were moved.',
    successSummary: `${totalLabel} is now held in escrow, committed until each milestone's deadline.`,
    steps,
  };
}

/** Deposit into an already-created escrow that is still awaiting funds. */
export function fundEscrowIntent(
  detail: EscrowDetail,
  existingAllowance: bigint,
  canPermit: boolean,
): TxIntent {
  const total = detail.totalAmount;
  const totalLabel = `${formatTokenAmount(total, detail.token.decimals)} ${detail.token.symbol}`;
  const alreadyApproved = existingAllowance >= total;
  const usePermit = canPermit && !alreadyApproved;

  const steps: TxIntent['steps'] = [];

  if (usePermit) {
    let permit: Awaited<ReturnType<typeof signPermit>> | undefined;

    steps.push(
      {
        label: `Authorise ${totalLabel}`,
        kind: 'sign',
        description:
          'A signature, not a transaction. It costs no gas and moves nothing by itself.',
        run: async (signer) => {
          permit = await signPermit(signer, detail.paymentToken, detail.address, total);
        },
      },
      {
        label: `Deposit ${totalLabel}`,
        kind: 'send',
        description: 'Applies the authorisation and transfers the full amount into the escrow.',
        run: (signer) => {
          if (!permit) throw new Error('The authorisation signature is missing.');
          return fundEscrowWithPermit(signer, detail.address, permit);
        },
      },
    );
  } else {
    if (!alreadyApproved) {
      steps.push({
        label: `Approve ${totalLabel}`,
        kind: 'approve',
        description:
          'Permits the escrow contract to move this amount. It does not transfer anything.',
        run: (signer) => approveToken(signer, detail.paymentToken, detail.address, total),
      });
    }
    steps.push({
      label: `Deposit ${totalLabel}`,
      kind: 'send',
      description: 'Transfers the full amount into the escrow contract.',
      run: (signer) => fundEscrow(signer, detail.address),
    });
  }

  return {
    title: 'Fund this escrow',
    actionLabel: `Deposit ${totalLabel}`,
    irreversible: true,
    facts: [
      addressFact('Escrow contract', detail.address),
      addressFact('Developer', detail.developer),
      amountFact('Total deposited', total, detail, true),
      amountFact(
        'Platform fee if all released',
        totalFeeFor(detail.milestones.map((m) => m.amount), detail.feeBps),
        detail,
      ),
      networkFact(),
    ],
    disclosures: [
      usePermit
        ? 'This takes one signature, which is free, and one transaction.'
        : alreadyApproved
          ? 'The escrow contract is already approved for this amount, so only the deposit needs confirming.'
          : 'This takes two wallet confirmations: an approval, then the deposit itself.',
      "Once deposited, the funds leave your wallet. You can release them per milestone at any time, but you can only take them back after a milestone's deadline passes unreleased.",
    ],
    failureReassurance: 'No funds were deposited.',
    successSummary: `${totalLabel} is now held in escrow.`,
    steps,
  };
}

/**
 * Reclaim overdue milestones.
 *
 * This replaces both `cancelMilestone` and the unrestricted `cancelProject`.
 * The deadline is the entire difference: the funder cannot touch money
 * committed to work that is still in date.
 */
export function reclaimMilestonesIntent(
  detail: EscrowDetail,
  milestones: Milestone[],
  names?: Record<number, string>,
): TxIntent {
  const total = milestones.reduce((sum, m) => sum + m.amount, 0n);
  const totalLabel = `${formatTokenAmount(total, detail.token.decimals)} ${detail.token.symbol}`;
  const many = milestones.length > 1;

  return {
    title: many ? `Reclaim ${milestones.length} milestones` : `Reclaim ${milestoneLabel(milestones[0], names)}`,
    actionLabel: `Reclaim ${totalLabel}`,
    irreversible: true,
    facts: [
      {
        label: many ? 'Milestones' : 'Milestone',
        value: milestones.map((m) => milestoneLabel(m, names)).join(', '),
      },
      { label: 'Deadline passed', value: formatDate(milestones[0].deadline) },
      addressFact('Returned to', detail.funder),
      amountFact('Returned to you', total, detail, true),
      networkFact(),
    ],
    disclosures: [
      'These deadlines have passed without the work being released, so the funds return to your wallet immediately.',
      'No platform fee is charged. This is your own deposit coming back.',
      'The developer is not paid for this work and cannot reverse it. Any milestone still in date is unaffected.',
    ],
    failureReassurance: 'Nothing was reclaimed and no funds moved.',
    successSummary: `${totalLabel} was returned to you.`,
    steps: [
      {
        label: `Reclaim ${totalLabel}`,
        kind: 'send',
        run: (signer) =>
          reclaimMilestones(
            signer,
            detail.address,
            milestones.map((m) => m.index),
          ),
      },
    ],
  };
}

/**
 * Raise a dispute.
 *
 * The disclosures are now the same for both roles, because the contract now
 * treats both roles the same. The previous version had to warn the developer
 * that the funder could resolve any dispute instantly while they waited thirty
 * days; that asymmetry was the reason the contract was rewritten.
 */
export function raiseDisputeIntent(
  detail: EscrowDetail,
  reason: string,
  role: 'funder' | 'developer',
): TxIntent {
  const window = formatDuration(PROTOCOL.disputeWindowSeconds);

  return {
    title: 'Raise a dispute',
    actionLabel: 'Raise dispute',
    irreversible: false,
    facts: [
      { label: 'Reason', value: reason },
      addressFact('Escrow contract', detail.address),
      amountFact('Amount in escrow', detail.contractBalance, detail, true),
      { label: 'Freezes reclaim for', value: window },
      networkFact(),
    ],
    disclosures: [
      `This freezes the funder's ability to reclaim overdue milestones for ${window}, then lapses on its own.`,
      'It does not pause releases. Paying the developer is never blocked, disputed or not.',
      'A dispute moves no money and decides nothing. There is no arbitrator — it buys time to settle between yourselves.',
      role === 'developer'
        ? 'You can raise a dispute once. Use it when a deadline is approaching and you need the funder not to withdraw while you settle.'
        : 'You can raise a dispute once. Note it freezes your own ability to reclaim, so it is of most use to the developer.',
      'You can withdraw it early if the disagreement is resolved.',
    ],
    failureReassurance: 'No dispute was raised.',
    successSummary: `The dispute is open. Reclaims are frozen for ${window}.`,
    steps: [
      {
        label: 'Raise dispute',
        kind: 'send',
        run: (signer) => raiseDispute(signer, detail.address, reason),
      },
    ],
  };
}

/** Lift a live dispute early. Only the party who raised it may do this. */
export function withdrawDisputeIntent(detail: EscrowDetail): TxIntent {
  return {
    title: 'Withdraw the dispute',
    actionLabel: 'Withdraw dispute',
    irreversible: false,
    facts: [
      addressFact('Escrow contract', detail.address),
      { label: 'Would otherwise lapse', value: formatDate(detail.disputeExpiresAt) },
      networkFact(),
    ],
    disclosures: [
      'The freeze on reclaiming overdue milestones lifts immediately.',
      'You cannot raise a second dispute on this escrow. Each party gets one.',
    ],
    failureReassurance: 'The dispute is still open.',
    successSummary: 'The dispute was withdrawn and the freeze lifted.',
    steps: [
      {
        label: 'Withdraw dispute',
        kind: 'send',
        run: (signer) => withdrawDispute(signer, detail.address),
      },
    ],
  };
}

/**
 * Return everything unsettled to the funder, long after the last deadline.
 *
 * Callable by anyone, which is why the intent names the destination rather than
 * saying "to you" — the caller is frequently not the funder. Without this, a
 * funder who walks away leaves the money in a contract nobody can touch.
 */
export function sweepIntent(detail: EscrowDetail): TxIntent {
  const remaining = detail.contractBalance;
  const remainingLabel = `${formatTokenAmount(remaining, detail.token.decimals)} ${detail.token.symbol}`;

  return {
    title: 'Close this escrow',
    actionLabel: 'Return funds to the funder',
    irreversible: true,
    facts: [
      addressFact('Escrow contract', detail.address),
      addressFact('Returned to', detail.funder),
      amountFact('Amount', remaining, detail, true),
      networkFact(),
    ],
    disclosures: [
      `Every deadline passed more than ${formatDuration(PROTOCOL.sweepGraceSeconds)} ago with these milestones unsettled.`,
      'The funds can only go to the funder, which is why anyone is allowed to make this call.',
      'This closes the escrow permanently.',
    ],
    failureReassurance: 'The escrow was not closed and no funds moved.',
    successSummary: `${remainingLabel} was returned to ${shortenAddress(detail.funder)} and the escrow is closed.`,
    steps: [
      {
        label: 'Close and return funds',
        kind: 'send',
        run: (signer) => sweepEscrow(signer, detail.address),
      },
    ],
  };
}
