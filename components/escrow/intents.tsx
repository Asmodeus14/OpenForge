import { createElement } from 'react';
import {
  approveToken,
  cancelMilestone,
  cancelProject,
  deployEscrow,
  fundEscrow,
  raiseDispute,
  releaseMilestone,
  resolveDisputeToDeveloper,
  resolveDisputeToFunder,
  type DeployEscrowParams,
  type EscrowDetail,
  type Milestone,
} from '@/chain/escrow';
import { registerProject } from '@/chain/escrowRegistry';
import {
  DEFAULT_CHAIN,
  PROTOCOL,
  calculateFee,
  calculateNetAmount,
  type TokenInfo,
} from '@/chain/config';
import { formatTokenAmount, formatDuration, shortenAddress } from '@/lib/format';
import { AddressDisplay, TokenAmount } from '@/components/trust/Trust';
import type { TxIntent } from '@/hooks/useTransaction';

/**
 * Escrow transaction intents.
 *
 * Kept beside the contract calls they describe, so the facts a user is shown
 * cannot drift away from what the transaction actually does. Every intent
 * states the amount, the recipient, the fee and the consequence before a
 * wallet is ever opened.
 *
 * Facts are built with the same `TokenAmount` and `AddressDisplay`
 * components the pages use, so a figure in a confirmation dialog is produced
 * by identical code to the figure on the page behind it.
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
 * Release a milestone.
 *
 * The button names the NET amount, because that is what the developer
 * actually receives — the gross figure would overstate it by the 1.5% fee.
 */
export function releaseMilestoneIntent(
  detail: EscrowDetail,
  milestone: Milestone,
): TxIntent {
  const fee = calculateFee(milestone.amount);
  const net = calculateNetAmount(milestone.amount);
  const netLabel = `${formatTokenAmount(net, detail.token.decimals)} ${detail.token.symbol}`;

  return {
    title: `Release milestone ${milestone.index + 1}`,
    actionLabel: `Release ${netLabel}`,
    irreversible: true,
    facts: [
      { label: 'Milestone', value: milestone.description || `Milestone ${milestone.index + 1}` },
      addressFact('Recipient', detail.developer),
      amountFact('Milestone amount', milestone.amount, detail),
      amountFact('Platform fee (1.5%)', fee, detail),
      amountFact('Developer receives', net, detail, true),
      networkFact(),
    ],
    disclosures: [
      `A ${Number(PROTOCOL.feeBasisPoints) / 100}% platform fee is deducted on release and sent to a fixed address. No fee is charged on disputes or cancellations.`,
      'Released funds cannot be recalled. Only release a milestone once you are satisfied the work is complete.',
    ],
    failureReassurance: 'Your funds have NOT been released.',
    successSummary: `${netLabel} was sent to ${shortenAddress(detail.developer)}.`,
    steps: [
      {
        label: `Release ${netLabel}`,
        kind: 'send',
        description: 'Transfers the milestone reward and pays the platform fee.',
        run: (signer) => releaseMilestone(signer, detail.address, milestone.index),
      },
    ],
  };
}

/**
 * Total fee across a set of milestones.
 *
 * Summed per milestone rather than taken on the total, because the contract
 * charges each release separately and Solidity's division truncates. On a
 * 6-decimal token the two methods can differ, and the figure shown must be
 * the one the contract will actually take.
 */
export function totalFeeFor(amounts: bigint[]): bigint {
  return amounts.reduce((sum, amount) => sum + calculateFee(amount), 0n);
}

export interface DeployEscrowIntentInput {
  params: DeployEscrowParams;
  token: TokenInfo;
  title: string;
  description: string;
  tags: string[];
  /** Current allowance the escrow token grants. Approval is skipped if it
   *  already covers the total, so the user is not asked to sign needlessly. */
  existingAllowance: bigint;
  /** Receives the deployed address as soon as it is known, so the caller can
   *  navigate to it even if a later step fails. */
  onDeployed?: (address: string) => void;
}

/**
 * Deploy, register, approve and fund — as four visible steps.
 *
 * The old implementation ran these behind a single spinner, so the number of
 * wallet prompts was a surprise and a failure at step three left the user with
 * no idea what had already happened. Each is named here before anything is
 * signed.
 */
export function deployEscrowIntent(input: DeployEscrowIntentInput): TxIntent {
  const { params, token, existingAllowance } = input;

  const amounts = params.milestones.map((m) => m.amount);
  const total = amounts.reduce((sum, amount) => sum + amount, 0n);
  const fee = totalFeeFor(amounts);
  const net = total - fee;
  const totalLabel = `${formatTokenAmount(total, token.decimals)} ${token.symbol}`;

  const needsApproval = existingAllowance < total;

  // Assigned by the deploy step and read by the three that follow it.
  let escrowAddress = '';

  const steps: TxIntent['steps'] = [
    {
      label: 'Deploy the escrow contract',
      kind: 'deploy',
      description: 'Creates a contract that will hold the funds. No tokens move yet.',
      run: async (signer) => {
        const { address, tx } = await deployEscrow(signer, params);
        escrowAddress = address;
        input.onDeployed?.(address);
        return tx;
      },
    },
    {
      label: 'List it in the project registry',
      kind: 'send',
      description:
        'Without this the escrow has no index entry and cannot be found again from this app.',
      run: (signer) =>
        registerProject(signer, escrowAddress, input.title, input.description, input.tags),
    },
  ];

  if (needsApproval) {
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

  return {
    title: 'Create and fund an escrow',
    actionLabel: `Deposit ${totalLabel}`,
    irreversible: true,
    facts: [
      { label: 'Project', value: input.title },
      addressFact('Developer', params.developer),
      { label: 'Token', value: `${token.symbol} — ${token.name}` },
      { label: 'Milestones', value: String(params.milestones.length) },
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
      `This takes ${steps.length} wallet confirmations, in this order. Each costs a network fee in ${DEFAULT_CHAIN.nativeSymbol}.`,
      'You are the funder. Only you can release milestones, cancel them, or cancel the whole project. The developer cannot move funds.',
      `A ${Number(PROTOCOL.feeBasisPoints) / 100}% fee is deducted from each milestone as it is released, and sent to a fixed address. No fee is charged on disputes or cancellations.`,
      `Either party can raise a dispute. You could then resolve it in your own favour immediately, while the developer would have to wait ${formatDuration(PROTOCOL.disputeTimeoutSeconds)}.`,
    ],
    failureReassurance: 'No contract was deployed and no funds were moved.',
    successSummary: `${totalLabel} is now held in escrow and released only when you approve each milestone.`,
    steps,
  };
}

/** Deposit into an already-deployed escrow that is still awaiting funds. */
export function fundEscrowIntent(detail: EscrowDetail, existingAllowance: bigint): TxIntent {
  const total = detail.totalAmount;
  const totalLabel = `${formatTokenAmount(total, detail.token.decimals)} ${detail.token.symbol}`;
  const needsApproval = existingAllowance < total;

  const steps: TxIntent['steps'] = [];

  if (needsApproval) {
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

  return {
    title: 'Fund this escrow',
    actionLabel: `Deposit ${totalLabel}`,
    irreversible: true,
    facts: [
      addressFact('Escrow contract', detail.address),
      addressFact('Developer', detail.developer),
      amountFact('Total deposited', total, detail, true),
      amountFact('Platform fee if all released', totalFeeFor(detail.milestones.map((m) => m.amount)), detail),
      networkFact(),
    ],
    disclosures: [
      needsApproval
        ? 'This takes two wallet confirmations: an approval, then the deposit itself.'
        : 'The escrow contract is already approved for this amount, so only the deposit needs confirming.',
      'Once deposited, funds leave your wallet and are held by the contract. You can release them per milestone, or cancel to have the remainder returned.',
    ],
    failureReassurance: 'No funds were deposited.',
    successSummary: `${totalLabel} is now held in escrow.`,
    steps,
  };
}

/** Cancel a milestone. Only possible once its deadline has passed. */
export function cancelMilestoneIntent(
  detail: EscrowDetail,
  milestone: Milestone,
): TxIntent {
  return {
    title: `Cancel milestone ${milestone.index + 1}`,
    actionLabel: 'Cancel milestone',
    irreversible: true,
    facts: [
      { label: 'Milestone', value: milestone.description || `Milestone ${milestone.index + 1}` },
      addressFact('Refunded to', detail.funder),
      amountFact('Refunded to you', milestone.amount, detail, true),
      networkFact(),
    ],
    disclosures: [
      // The contract transfers straight back to the funder's wallet — it does
      // not hold the amount for reallocation.
      'The full milestone amount is transferred back to your wallet immediately. The developer is not paid for this milestone.',
      'No platform fee is charged on cancellation, so you receive the whole amount back.',
      'The rest of the escrow is unaffected and its other milestones remain live.',
    ],
    failureReassurance: 'The milestone was not cancelled and no funds moved.',
    successSummary: `Milestone ${milestone.index + 1} was cancelled and ${formatTokenAmount(milestone.amount, detail.token.decimals)} ${detail.token.symbol} returned to you.`,
    steps: [
      {
        label: 'Cancel milestone',
        kind: 'send',
        run: (signer) => cancelMilestone(signer, detail.address, milestone.index),
      },
    ],
  };
}

/** End the whole project and return the remaining balance to the funder. */
export function cancelProjectIntent(detail: EscrowDetail): TxIntent {
  const remaining = detail.contractBalance;

  return {
    title: 'Cancel this project',
    actionLabel: 'Cancel project',
    irreversible: true,
    facts: [
      addressFact('Escrow contract', detail.address),
      addressFact('Developer', detail.developer),
      amountFact('Returned to you', remaining, detail, true),
      networkFact(),
    ],
    disclosures: [
      'Every unreleased milestone is cancelled and the remaining balance is returned to you.',
      'The developer is not paid for any unreleased work, and cannot reverse this.',
      'Cancelled is a final state. The escrow cannot be restarted.',
    ],
    failureReassurance: 'The project was not cancelled and your funds have not moved.',
    successSummary: 'The project was cancelled and the remaining balance returned to you.',
    steps: [
      {
        label: 'Cancel project',
        kind: 'send',
        run: (signer) => cancelProject(signer, detail.address),
      },
    ],
  };
}

/**
 * Raise a dispute.
 *
 * The disclosures state the asymmetry plainly and differently for each role,
 * because it materially disadvantages the developer and hiding that would be
 * the single most dishonest thing this interface could do.
 */
export function raiseDisputeIntent(
  detail: EscrowDetail,
  reason: string,
  role: 'funder' | 'developer',
): TxIntent {
  const timeout = formatDuration(PROTOCOL.disputeTimeoutSeconds);

  return {
    title: 'Raise a dispute',
    actionLabel: 'Raise dispute',
    irreversible: true,
    facts: [
      { label: 'Reason', value: reason },
      addressFact('Escrow contract', detail.address),
      amountFact('Amount in escrow', detail.contractBalance, detail, true),
      networkFact(),
    ],
    disclosures: [
      'Raising a dispute pauses all milestone releases.',
      role === 'developer'
        ? `The funder can resolve this dispute in their own favour immediately. You cannot resolve it in yours until ${timeout} have passed.`
        : `You can resolve this dispute in your own favour immediately. The developer cannot resolve it in theirs until ${timeout} have passed.`,
      'No platform fee is charged on dispute resolution.',
    ],
    failureReassurance: 'No dispute was raised.',
    successSummary: 'The dispute is now open and releases are paused.',
    steps: [
      {
        label: 'Raise dispute',
        kind: 'send',
        run: (signer) => raiseDispute(signer, detail.address, reason),
      },
    ],
  };
}

/** Funder resolves in their own favour — permitted immediately. */
export function resolveToFunderIntent(detail: EscrowDetail): TxIntent {
  return {
    title: 'Resolve the dispute in your favour',
    actionLabel: 'Return funds to me',
    irreversible: true,
    facts: [
      addressFact('Returned to', detail.funder),
      amountFact('Amount', detail.contractBalance, detail, true),
      networkFact(),
    ],
    disclosures: [
      'The full remaining balance is returned to you and the project is closed as Cancelled.',
      'The developer is not paid for any unreleased work.',
      'This is final and cannot be appealed inside OpenForge.',
    ],
    failureReassurance: 'The dispute was not resolved and no funds moved.',
    successSummary: 'The remaining balance was returned to you.',
    steps: [
      {
        label: 'Resolve to funder',
        kind: 'send',
        run: (signer) => resolveDisputeToFunder(signer, detail.address),
      },
    ],
  };
}

/** Developer resolves in their own favour — only after the timeout. */
export function resolveToDeveloperIntent(detail: EscrowDetail): TxIntent {
  return {
    title: 'Resolve the dispute in your favour',
    actionLabel: 'Claim remaining funds',
    irreversible: true,
    facts: [
      addressFact('Paid to', detail.developer),
      amountFact('Amount', detail.contractBalance, detail, true),
      networkFact(),
    ],
    disclosures: [
      `The dispute timeout of ${formatDuration(PROTOCOL.disputeTimeoutSeconds)} has passed, so you can now claim the remaining balance.`,
      'No platform fee is charged on dispute resolution, so you receive the full amount.',
      'This closes the project as Completed and is final.',
    ],
    failureReassurance: 'The dispute was not resolved and no funds moved.',
    successSummary: 'The remaining balance was paid to you.',
    steps: [
      {
        label: 'Resolve to developer',
        kind: 'send',
        run: (signer) => resolveDisputeToDeveloper(signer, detail.address),
      },
    ],
  };
}
