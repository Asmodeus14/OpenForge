/**
 * SimpleMilestoneEscrow — reads and writes.
 *
 * Extracted verbatim in behaviour from EsCrow.tsx. Nothing about which
 * contract call runs, in what order, with what arguments has changed; only
 * where the code lives and how failures surface.
 *
 * Facts from the deployed contract that this module encodes:
 *  - Only the funder may fund, release, cancel, or resolve a dispute in their
 *    own favour. The developer may only raise a dispute, or resolve one in
 *    their favour after 30 days.
 *  - Milestone descriptions must be read from `getMilestones()`. The
 *    registry's `getEscrowInfo()` appends " (Deadline: N days)" to them.
 *  - `releasedAmount` accumulates GROSS amounts; the `MilestoneReleased`
 *    event reports the NET amount sent to the developer.
 */

import {
  Contract,
  ContractFactory,
  type ContractTransactionResponse,
  type Provider,
  type Signer,
} from 'ethers';
import {
  SimpleMilestoneEscrowABI,
  SimpleMilestoneEscrowBytecode,
} from './abi/escrow';
import { EscrowState } from '@/lib/status';
import { getErc20, getTokenInfo } from './erc20';
import type { TokenInfo } from './config';

export interface Milestone {
  index: number;
  amount: bigint;
  released: boolean;
  cancelled: boolean;
  /** Unix seconds. `0n` means no deadline. */
  deadline: bigint;
  description: string;
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
  /** Gross amount released so far. Not what the developer received. */
  releasedAmount: bigint;
  totalFeesCollected: bigint;
  /** Live token balance held by the contract. */
  contractBalance: bigint;
  /** Unix seconds; `0n` if no dispute has been raised. */
  disputeRaisedAt: bigint;
  milestones: Milestone[];
}

export function getEscrow(address: string, runner: Provider | Signer): Contract {
  return new Contract(address, SimpleMilestoneEscrowABI, runner);
}

/* ------------------------------------------------------------------ reading */

/**
 * Loads the full state of one escrow.
 *
 * All independent calls are issued together so ethers can batch them into a
 * single RPC round-trip, rather than the sequential per-milestone loop this
 * replaces.
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
    state,
    totalAmount,
    releasedAmount,
    totalFeesCollected,
    disputeRaisedAt,
    rawMilestones,
  ] = await Promise.all([
    escrow.funder() as Promise<string>,
    escrow.developer() as Promise<string>,
    escrow.paymentToken() as Promise<string>,
    escrow.state() as Promise<bigint>,
    escrow.totalAmount() as Promise<bigint>,
    escrow.releasedAmount() as Promise<bigint>,
    escrow.totalFeesCollected() as Promise<bigint>,
    escrow.disputeRaisedAt() as Promise<bigint>,
    // Raw descriptions — see the note at the top of this file.
    escrow.getMilestones() as Promise<
      readonly {
        amount: bigint;
        released: boolean;
        cancelled: boolean;
        deadline: bigint;
        description: string;
      }[]
    >,
  ]);

  const [token, contractBalance] = await Promise.all([
    getTokenInfo(paymentToken, provider, chainId),
    getErc20(paymentToken, provider).balanceOf(address) as Promise<bigint>,
  ]);

  return {
    address,
    funder,
    developer,
    paymentToken,
    token,
    state: Number(state) as EscrowState,
    totalAmount,
    releasedAmount,
    totalFeesCollected,
    contractBalance,
    disputeRaisedAt,
    milestones: rawMilestones.map((m, index) => ({
      index,
      amount: m.amount,
      released: m.released,
      cancelled: m.cancelled,
      deadline: m.deadline,
      description: m.description,
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

/**
 * What the connected account may actually do right now.
 *
 * Derived from on-chain state and role so the UI can disable impossible
 * actions rather than letting the transaction revert in the user's wallet.
 */
export function permissionsFor(detail: EscrowDetail, role: EscrowRole) {
  const isFunder = role === 'funder';
  const isDeveloper = role === 'developer';
  const funded = detail.state === EscrowState.Funded;
  const disputed = detail.state === EscrowState.Disputed;

  const disputeElapsed =
    detail.disputeRaisedAt > 0n &&
    BigInt(Math.floor(Date.now() / 1000)) >= detail.disputeRaisedAt + 2_592_000n;

  return {
    canFund: isFunder && detail.state === EscrowState.Created,
    canRelease: isFunder && funded,
    canCancelMilestone: isFunder && funded,
    canCancelProject: isFunder && funded,
    canRaiseDispute: (isFunder || isDeveloper) && funded,
    /** The funder may end a dispute in their own favour at any time. */
    canResolveToFunder: isFunder && disputed,
    /** The developer must wait 30 days from when the dispute was raised. */
    canResolveToDeveloper: isDeveloper && disputed && disputeElapsed,
    disputeUnlocksAt:
      detail.disputeRaisedAt > 0n ? detail.disputeRaisedAt + 2_592_000n : undefined,
  };
}

/** A milestone may only be cancelled once its deadline has passed. */
export function canCancelMilestone(milestone: Milestone): boolean {
  if (milestone.released || milestone.cancelled) return false;
  if (milestone.deadline === 0n) return false;
  return BigInt(Math.floor(Date.now() / 1000)) > milestone.deadline;
}

/* ------------------------------------------------------------------ writing */

export interface DeployEscrowParams {
  funder: string;
  developer: string;
  token: string;
  milestones: { amount: bigint; deadline: bigint; description: string }[];
}

/**
 * Deploys a new escrow from the embedded bytecode.
 *
 * The bytecode was byte-for-byte verified against the compiled artifact in
 * OpenForge-Contracts, so the deployed contract is exactly the audited source
 * — including the 1.5% fee and its fixed recipient.
 */
export async function deployEscrow(
  signer: Signer,
  params: DeployEscrowParams,
): Promise<{ address: string; tx: ContractTransactionResponse }> {
  const factory = new ContractFactory(
    SimpleMilestoneEscrowABI,
    SimpleMilestoneEscrowBytecode,
    signer,
  );

  const contract = await factory.deploy(
    params.funder,
    params.developer,
    params.token,
    params.milestones.map((m) => m.amount),
    params.milestones.map((m) => m.deadline),
    params.milestones.map((m) => m.description),
  );

  const tx = contract.deploymentTransaction();
  if (!tx) throw new Error('The deployment transaction was not created.');

  await contract.waitForDeployment();
  return { address: await contract.getAddress(), tx };
}

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

export function releaseMilestone(
  signer: Signer,
  escrowAddress: string,
  index: number,
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).releaseMilestone(index);
}

export function cancelMilestone(
  signer: Signer,
  escrowAddress: string,
  index: number,
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).cancelMilestone(index);
}

export function cancelProject(
  signer: Signer,
  escrowAddress: string,
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).cancelProject();
}

export function raiseDispute(
  signer: Signer,
  escrowAddress: string,
  reason: string,
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).raiseDispute(reason);
}

export function resolveDisputeToDeveloper(
  signer: Signer,
  escrowAddress: string,
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).resolveDisputeToDeveloper();
}

export function resolveDisputeToFunder(
  signer: Signer,
  escrowAddress: string,
): Promise<ContractTransactionResponse> {
  return getEscrow(escrowAddress, signer).resolveDisputeToFunder();
}
