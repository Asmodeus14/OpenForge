/**
 * MilestoneEscrow — reads and writes.
 *
 * What this contract guarantees, stated plainly because the interface has to
 * repeat it at every decision point: it guarantees the money exists, that it is
 * committed until the agreed deadline, and that neither party can take the
 * other's share. It does **not** guarantee that delivered work gets paid. There
 * is no arbitrator, so nothing on chain can judge whether a milestone was
 * actually completed. The funder decides, and if they refuse, the money returns
 * to them once the deadline passes.
 *
 * That is a smaller promise than the previous version appeared to make and a
 * much larger one than it kept — `cancelProject()` let the funder withdraw
 * every unreleased token at any moment, with no notice and no developer
 * consent.
 *
 * Facts this module encodes:
 *  - Release is the funder's alone, and is never blocked — not by a deadline,
 *    not by a dispute.
 *  - Reclaim is the funder's alone, and only after a milestone's deadline has
 *    passed unreleased. This is the whole of the developer's protection.
 *  - A dispute is a 14-day freeze on reclaim that either party may raise once.
 *    It moves no money and decides nothing.
 *  - Milestone descriptions are **not on chain**. They live in the project's
 *    IPFS metadata, where fixing a typo is a pin rather than a storage write.
 *  - `releasedGross` and the `MilestoneReleased` event both report gross. The
 *    previous pair disagreed by exactly the fee.
 */

import {
  Contract,
  type ContractTransactionResponse,
  type Provider,
  type Signer,
} from 'ethers';
import { MilestoneEscrowABI } from './abi/escrow';
import { EscrowState, OnChainMilestoneStatus } from '@/lib/status';
import { getErc20, getTokenInfo } from './erc20';
import type { TokenInfo } from './config';

export interface Milestone {
  index: number;
  amount: bigint;
  /** Unix seconds. Always set — the constructor rejects absent or past deadlines. */
  deadline: bigint;
  status: OnChainMilestoneStatus;
}

export interface EscrowDetail {
  address: string;
  funder: string;
  developer: string;
  paymentToken: string;
  token: TokenInfo;
  state: EscrowState;
  /** Sum of all milestone amounts, gross of fees. */
  totalAmount: bigint;
  /** Gross value released so far. Not what the developer received. */
  releasedGross: bigint;
  /** Value returned to the funder by reclaim or sweep. */
  reclaimedTotal: bigint;
  /** Live token balance held by the contract. */
  contractBalance: bigint;
  /** Milestones settled either way. When it reaches the count, the escrow closes. */
  resolvedCount: number;
  /** True while a live dispute is blocking reclaim. */
  frozen: boolean;
  /** Unix seconds the freeze lifts; `0n` if no dispute has been raised. */
  disputeExpiresAt: bigint;
  funderRaisedDispute: boolean;
  developerRaisedDispute: boolean;
  /** Basis points, read from this escrow rather than assumed. */
  feeBps: bigint;
  feeRecipient: string;
  milestones: Milestone[];
}

export function getEscrow(address: string, runner: Provider | Signer): Contract {
  return new Contract(address, MilestoneEscrowABI, runner);
}

/* ------------------------------------------------------------------ reading */

/**
 * Loads the full state of one escrow.
 *
 * `summary()` exists on the contract precisely so this is one call instead of
 * the nine that rendering an escrow used to take. The fee terms are read rather
 * than taken from `PROTOCOL`, because they are immutables of whichever factory
 * made this escrow and the interface must not quote a fee the contract will not
 * charge.
 */
export async function fetchEscrowDetail(
  address: string,
  provider: Provider,
  chainId: number,
): Promise<EscrowDetail> {
  const escrow = getEscrow(address, provider);

  const [
    funder,
    developer,
    paymentToken,
    summary,
    rawMilestones,
    funderRaisedDispute,
    developerRaisedDispute,
    feeBps,
    feeRecipient,
  ] = await Promise.all([
    escrow.funder() as Promise<string>,
    escrow.developer() as Promise<string>,
    escrow.token() as Promise<string>,
    escrow.summary() as Promise<{
      currentState: bigint;
      total: bigint;
      released: bigint;
      reclaimed: bigint;
      balance: bigint;
      count: bigint;
      resolved: bigint;
      frozen: boolean;
      disputeExpiresAt: bigint;
    }>,
    escrow.milestones() as Promise<
      readonly { amount: bigint; deadline: bigint; status: bigint }[]
    >,
    escrow.funderRaisedDispute() as Promise<boolean>,
    escrow.developerRaisedDispute() as Promise<boolean>,
    escrow.feeBps() as Promise<bigint>,
    escrow.feeRecipient() as Promise<string>,
  ]);

  const token = await getTokenInfo(paymentToken, provider, chainId);

  return {
    address,
    funder,
    developer,
    paymentToken,
    token,
    state: Number(summary.currentState) as EscrowState,
    totalAmount: summary.total,
    releasedGross: summary.released,
    reclaimedTotal: summary.reclaimed,
    // From `summary()`, so it is the same read as everything else rather than
    // a second round-trip to the token.
    contractBalance: summary.balance,
    resolvedCount: Number(summary.resolved),
    frozen: summary.frozen,
    disputeExpiresAt: summary.disputeExpiresAt,
    funderRaisedDispute,
    developerRaisedDispute,
    feeBps,
    feeRecipient,
    milestones: rawMilestones.map((m, index) => ({
      index,
      amount: m.amount,
      deadline: m.deadline,
      status: Number(m.status) as OnChainMilestoneStatus,
    })),
  };
}

/* ------------------------------------------------------------------ roles */

export type EscrowRole = 'funder' | 'developer' | 'observer';

export function roleFor(detail: EscrowDetail, account: string | null | undefined): EscrowRole {
  if (!account) return 'observer';
  const lower = account.toLowerCase();
  if (detail.funder.toLowerCase() === lower) return 'funder';
  if (detail.developer.toLowerCase() === lower) return 'developer';
  return 'observer';
}

/** A milestone is reclaimable only once its deadline has passed unreleased. */
export function isReclaimable(milestone: Milestone): boolean {
  if (milestone.status !== OnChainMilestoneStatus.Pending) return false;
  return BigInt(Math.floor(Date.now() / 1000)) > milestone.deadline;
}

/** A milestone the funder can still pay. Deadlines never block payment. */
export function isReleasable(milestone: Milestone): boolean {
  return milestone.status === OnChainMilestoneStatus.Pending;
}

/** Unix seconds after which `sweep()` becomes callable, by anyone. */
export function sweepUnlocksAt(detail: EscrowDetail): bigint {
  const latest = detail.milestones.reduce((max, m) => (m.deadline > max ? m.deadline : max), 0n);
  return latest + 30n * 24n * 60n * 60n;
}

/**
 * What the connected account may actually do right now.
 *
 * Derived from on-chain state and role so the UI can disable impossible actions
 * rather than letting the transaction revert in the user's wallet — and, just
 * as importantly, so it never offers an action that would be a lie about who
 * holds power here.
 */
export function permissionsFor(detail: EscrowDetail, role: EscrowRole) {
  const isFunder = role === 'funder';
  const isDeveloper = role === 'developer';
  const isParty = isFunder || isDeveloper;
  const funded = detail.state === EscrowState.Funded;
  const now = BigInt(Math.floor(Date.now() / 1000));

  const alreadyRaised = isFunder
    ? detail.funderRaisedDispute
    : isDeveloper
      ? detail.developerRaisedDispute
      : true;

  return {
    canFund: isFunder && detail.state === EscrowState.Created,
    /** Never gated on a deadline or a dispute. Paying is always permitted. */
    canRelease: isFunder && funded && detail.milestones.some(isReleasable),
    /** Overdue milestones only, and not while a dispute is freezing them. */
    canReclaim:
      isFunder && funded && !detail.frozen && detail.milestones.some(isReclaimable),
    /**
     * Once each, per party. Without that cap, raising and withdrawing in a loop
     * would let one side keep the escrow frozen indefinitely.
     */
    canRaiseDispute: isParty && funded && !alreadyRaised,
    /** Only the party who raised the live dispute may lift it early. */
    canWithdrawDispute:
      funded &&
      detail.frozen &&
      ((isFunder && detail.funderRaisedDispute) ||
        (isDeveloper && detail.developerRaisedDispute)),
    /** Permissionless: the money can only ever go to the funder. */
    canSweep:
      funded &&
      now >= sweepUnlocksAt(detail) &&
      detail.milestones.some((m) => m.status === OnChainMilestoneStatus.Pending),
  };
}

/* ------------------------------------------------------------------ writing */

export function approveToken(
  signer: Signer,
  tokenAddress: string,
  spender: string,
  amount: bigint,
): Promise<ContractTransactionResponse> {
  return getErc20(tokenAddress, signer).approve(spender, amount);
}

export function fundEscrow(
  signer: Signer,
  escrowAddress: string,
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).fund();
}

/**
 * Approve and deposit in one transaction, for EIP-2612 tokens.
 *
 * Removes an entire wallet confirmation from funding. The contract swallows a
 * failing permit and falls through to `fund()`, so a griefer front-running the
 * permit cannot block the deposit if an allowance already exists.
 */
export function fundEscrowWithPermit(
  signer: Signer,
  escrowAddress: string,
  permit: { deadline: bigint; v: number; r: string; s: string },
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).fundWithPermit(
    permit.deadline,
    permit.v,
    permit.r,
    permit.s,
  );
}

/** Pays milestones to the developer, minus the fee. Batched. */
export function releaseMilestones(
  signer: Signer,
  escrowAddress: string,
  indexes: number[],
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).release(indexes);
}

/** Returns overdue, unreleased milestones to the funder. No fee is charged. */
export function reclaimMilestones(
  signer: Signer,
  escrowAddress: string,
  indexes: number[],
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).reclaim(indexes);
}

export function raiseDispute(
  signer: Signer,
  escrowAddress: string,
  reason: string,
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).raiseDispute(reason);
}

export function withdrawDispute(
  signer: Signer,
  escrowAddress: string,
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).withdrawDispute();
}

/** Returns everything unresolved to the funder, long after the last deadline. */
export function sweepEscrow(
  signer: Signer,
  escrowAddress: string,
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).sweep();
}
