/**
 * What creating an escrow will cost in gas.
 *
 * Creating an escrow is four separate transactions, and each one needs native
 * currency. Running out after the second leaves a deployed contract holding
 * nothing, which is the worst possible place to stop: the money is not at
 * risk, but the funder has paid to deploy something unusable and has to start
 * again. Pricing the sequence up front is the only way to avoid that.
 *
 * Two of the four can be priced exactly before anything is sent. The other two
 * cannot, and this module does not pretend otherwise:
 *
 *   deploy    exact    a plain deployment, estimable against current state
 *   approve   exact    the spender is the escrow's *predicted* address, and an
 *                      allowance write does not require it to exist yet
 *   register  no       `registerProject` calls `escrow.funder()` on the
 *                      address, which reverts while nothing is deployed there
 *   fund      no       calls `fund()` on a contract that does not exist yet
 *
 * A guessed figure for the last two would be indistinguishable on screen from
 * the two real ones, so they are reported as unavailable with the reason.
 */

import {
  ContractFactory,
  getCreateAddress,
  type Provider,
} from 'ethers';
import {
  SimpleMilestoneEscrowABI,
  SimpleMilestoneEscrowBytecode,
} from './abi/escrow';
import { getErc20 } from './erc20';
import type { DeployEscrowParams } from './escrow';

/**
 * A deploy configuration expressed in the form the *user* entered it — with
 * deadlines as "days from now" rather than absolute timestamps.
 *
 * The distinction matters for React purity: turning days into a timestamp
 * requires `Date.now()`, which cannot be called while rendering without the
 * value drifting on every re-render. So the spec stays pure and stable, and
 * the conversion happens inside the fetch.
 */
export interface DeploySpec {
  funder: string;
  developer: string;
  token: string;
  milestones: { amount: bigint; days: number; description: string }[];
}

/** Resolves a spec against the current clock. Never call during render. */
export function specToParams(spec: DeploySpec): DeployEscrowParams {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    funder: spec.funder,
    developer: spec.developer,
    token: spec.token,
    milestones: spec.milestones.map((milestone) => ({
      amount: milestone.amount,
      deadline: milestone.days > 0 ? BigInt(nowSeconds + milestone.days * 86_400) : 0n,
      description: milestone.description,
    })),
  };
}

export interface StepGas {
  key: 'deploy' | 'register' | 'approve' | 'fund';
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
  /** Where the escrow will deploy to, assuming the next transaction is this one. */
  predictedEscrowAddress: string;
}

/**
 * Prices as much of the deploy sequence as is knowable before it starts.
 *
 * The escrow's address is derived rather than guessed: a contract created by
 * an EOA lands at `keccak(rlp([sender, nonce]))`, so the spender for the
 * approval step is known exactly, provided this is the funder's next
 * transaction. That assumption is stated in the UI.
 */
export async function estimateDeployPreflight({
  provider,
  account,
  params,
  totalAmount,
}: {
  provider: Provider;
  account: string;
  params: DeployEscrowParams;
  /** Sum of the milestone amounts, in base units. */
  totalAmount: bigint;
}): Promise<GasPreflight> {
  const [nonce, feeData, balance] = await Promise.all([
    provider.getTransactionCount(account),
    provider.getFeeData(),
    provider.getBalance(account),
  ]);

  const predictedEscrowAddress = getCreateAddress({ from: account, nonce });

  const factory = new ContractFactory(
    SimpleMilestoneEscrowABI,
    SimpleMilestoneEscrowBytecode,
  );
  const deployTx = await factory.getDeployTransaction(
    params.funder,
    params.developer,
    params.token,
    params.milestones.map((m) => m.amount),
    params.milestones.map((m) => m.deadline),
    params.milestones.map((m) => m.description),
  );

  const [deployGas, approveGas] = await Promise.all([
    provider.estimateGas({ ...deployTx, from: account }).catch(() => null),
    getErc20(params.token, provider)
      .approve.estimateGas(predictedEscrowAddress, totalAmount, { from: account })
      .catch(() => null),
  ]);

  const steps: StepGas[] = [
    {
      key: 'deploy',
      label: 'Deploy the escrow contract',
      gas: deployGas,
      unavailable: deployGas === null ? 'The node would not price this.' : undefined,
    },
    {
      key: 'register',
      label: 'List it in the registry',
      gas: null,
      unavailable:
        'Cannot be priced yet — the registry reads the escrow’s funder, and nothing is deployed at that address until step one completes.',
    },
    {
      key: 'approve',
      label: 'Approve the tokens',
      gas: approveGas,
      unavailable: approveGas === null ? 'The token would not price this.' : undefined,
    },
    {
      key: 'fund',
      label: 'Deposit the tokens',
      gas: null,
      unavailable:
        'Cannot be priced yet — it calls the escrow, which does not exist until step one completes.',
    },
  ];

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
