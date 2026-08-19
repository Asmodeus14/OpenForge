/**
 * What creating an escrow will cost in gas.
 *
 * Running out of native currency partway through leaves a deployed contract
 * holding nothing, which is the worst possible place to stop: the money is not
 * at risk, but the funder has paid to create something unusable and has to
 * start again. Pricing the sequence up front is the only way to avoid that.
 *
 * The sequence used to be four transactions — deploy, register, approve, fund —
 * of which only two could be priced in advance. It is now two, and the first of
 * them is exact:
 *
 *   create   exact    a call to the factory, which already exists on chain, so
 *                     the node can simulate it against current state
 *   fund     no       calls the escrow, which does not exist until `create`
 *                     completes
 *
 * A guessed figure for the second would be indistinguishable on screen from the
 * real one, so it is reported as unavailable with the reason.
 */

import { Contract, getCreateAddress, type Provider } from 'ethers';
import { EscrowFactoryABI } from './abi/escrow';
import { getErc20 } from './erc20';
import { DEFAULT_CHAIN } from './config';
import type { CreateEscrowParams } from './escrowFactory';

/**
 * A deploy configuration expressed in the form the *user* entered it — with
 * deadlines as "days from now" rather than absolute timestamps.
 *
 * The distinction matters for React purity: turning days into a timestamp
 * requires `Date.now()`, which cannot be called while rendering without the
 * value drifting on every re-render. So the spec stays pure and stable, and the
 * conversion happens inside the fetch.
 */
export interface DeploySpec {
  funder: string;
  developer: string;
  token: string;
  /**
   * `description` no longer reaches the contract — milestone text lives in the
   * project's IPFS metadata now. It stays on the spec because the spec is what
   * the user entered and what the developer signs: an EIP-712 approval that
   * omitted the descriptions would have them agreeing to bare numbers.
   */
  milestones: { amount: bigint; days: number; description: string }[];
  /**
   * Stand-in for the metadata CID, which is not pinned until the user commits.
   * Its length is what costs calldata gas, so a representative CID gives a
   * representative estimate.
   */
  metadataCID?: string;
}

/** A CIDv1 of the length `uploadJsonToIpfs` produces. Used only for estimating. */
const PLACEHOLDER_CID = 'bafkreiabcdefghijklmnopqrstuvwxyz234567abcdefghijklmnopqrstuv';

/** Resolves a spec against the current clock. Never call during render. */
export function specToParams(spec: DeploySpec): CreateEscrowParams {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    developer: spec.developer,
    token: spec.token,
    milestones: spec.milestones.map((milestone) => ({
      amount: milestone.amount,
      // Deadlines are mandatory: the constructor reverts on anything not in
      // the future. A milestone with no deadline could never be reclaimed and
      // would strand the funder's money permanently.
      deadline: BigInt(nowSeconds + Math.max(1, milestone.days) * 86_400),
    })),
    metadataCID: spec.metadataCID || PLACEHOLDER_CID,
  };
}

export interface StepGas {
  key: 'create' | 'approve' | 'fund';
  label: string;
  /** Exact estimate in gas units, or null when it cannot be simulated yet. */
  gas: bigint | null;
  /** Present when `gas` is null: why this step cannot be priced. */
  unavailable?: string;
}

export interface GasPreflight {
  steps: StepGas[];
  /** Wei per unit of gas, from the node's current fee data. */
  gasPrice: bigint;
  /** Gas for the steps that could be priced. */
  knownGas: bigint;
  /** `knownGas * gasPrice`. A floor, not a total. */
  knownCost: bigint;
  balance: bigint;
  /**
   * True only when the balance cannot even cover the steps we could price.
   * Deliberately one-directional: we can prove "not enough", never "enough".
   */
  definitelyInsufficient: boolean;
  /** Where the escrow will land, assuming this is the factory's next deployment. */
  predictedEscrowAddress: string;
}

/**
 * Prices as much of the sequence as is knowable before it starts.
 *
 * The escrow's address is derived rather than guessed: a contract created by
 * another contract lands at `keccak(rlp([factory, factoryNonce]))`. That holds
 * only if nobody else creates an escrow first, which is why the approval step
 * is priced against it but the address is labelled as predicted in the UI.
 */
export async function estimateDeployPreflight({
  provider,
  account,
  params,
  totalAmount,
  /** Skipped when the token supports EIP-2612 and needs no approval transaction. */
  includeApproval = true,
}: {
  provider: Provider;
  account: string;
  params: CreateEscrowParams;
  /** Sum of the milestone amounts, in base units. */
  totalAmount: bigint;
  includeApproval?: boolean;
}): Promise<GasPreflight> {
  const factoryAddress = DEFAULT_CHAIN.contracts.escrowFactory;

  const [factoryNonce, feeData, balance] = await Promise.all([
    provider.getTransactionCount(factoryAddress),
    provider.getFeeData(),
    provider.getBalance(account),
  ]);

  const predictedEscrowAddress = getCreateAddress({
    from: factoryAddress,
    nonce: factoryNonce,
  });

  const factory = new Contract(factoryAddress, EscrowFactoryABI, provider);

  const [createGas, approveGas] = await Promise.all([
    factory.createEscrow
      .estimateGas(
        params.developer,
        params.token,
        params.milestones.map((m) => m.amount),
        params.milestones.map((m) => m.deadline),
        params.metadataCID,
        { from: account },
      )
      .catch(() => null),
    includeApproval
      ? getErc20(params.token, provider)
          .approve.estimateGas(predictedEscrowAddress, totalAmount, { from: account })
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const steps: StepGas[] = [
    {
      key: 'create',
      label: 'Create the escrow',
      gas: createGas,
      unavailable:
        createGas === null
          ? 'The node would not price this. Check the milestone deadlines are in the future.'
          : undefined,
    },
  ];

  if (includeApproval) {
    steps.push({
      key: 'approve',
      label: 'Approve the tokens',
      gas: approveGas,
      unavailable: approveGas === null ? 'The token would not price this.' : undefined,
    });
  }

  steps.push({
    key: 'fund',
    label: 'Deposit the tokens',
    gas: null,
    unavailable:
      'Cannot be priced yet — it calls the escrow, which does not exist until the first step completes.',
  });

  // `maxFeePerGas` is the ceiling actually charged on an EIP-1559 network, so
  // costing with it gives a figure the user will not exceed rather than one
  // they might.
  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;

  const knownGas = steps.reduce((sum, step) => sum + (step.gas ?? 0n), 0n);
  const knownCost = knownGas * gasPrice;

  return {
    steps,
    gasPrice,
    knownGas,
    knownCost,
    balance,
    definitelyInsufficient: knownCost > 0n && balance < knownCost,
    predictedEscrowAddress,
  };
}
