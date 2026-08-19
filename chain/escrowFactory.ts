/**
 * EscrowFactory — deploys every escrow and is the index of the ones it made.
 *
 * This replaces `escrowRegistry.ts`, which talked to a standalone registry that
 * authenticated an escrow by asking that address whether `funder()` returned
 * the caller. Ten lines of Solidity returning `msg.sender` were enough to
 * register a contract holding no money, under any title, and the registry was
 * what this product listed as real. `isOfficialEscrow` is now a fact the
 * factory recorded when it did the deploying, not a claim being re-checked.
 *
 * Note this is still a different contract from `projectRegistry.ts`. The two
 * remain disjoint in the deployed system: escrow-backed projects are indexed
 * here, metadata-only projects there, and they share no state.
 *
 * Titles, descriptions and tags are no longer on chain. They used to occupy
 * three storage slots per project — one of them a dynamic `string[]` — beside a
 * `projectCIDs` mapping pointing at the same information on IPFS. Only the
 * pointer survives, so editing a typo is a pin rather than a storage write.
 */

import { Contract, type ContractTransactionResponse, type Provider, type Signer } from 'ethers';
import { EscrowFactoryABI } from './abi/escrow';
import { DEFAULT_CHAIN } from './config';

export interface FactoryProject {
  projectId: bigint;
  escrowAddress: string;
  funder: string;
  developer: string;
  /** IPFS CID of the title, description, tags and milestone descriptions. */
  metadataCID: string;
  createdAt: bigint;
  active: boolean;
}

export function getEscrowFactory(runner: Provider | Signer): Contract {
  return new Contract(DEFAULT_CHAIN.contracts.escrowFactory, EscrowFactoryABI, runner);
}

/**
 * The struct carries no id — the array index is the id — so callers that need
 * one must supply it. `getProjects` returns a page newest-first, which makes
 * the id derivable from the total rather than the position.
 */
function toFactoryProject(
  raw: {
    escrow: string;
    active: boolean;
    funder: string;
    createdAt: bigint;
    developer: string;
    metadataCID: string;
  },
  projectId: bigint,
): FactoryProject {
  return {
    projectId,
    escrowAddress: raw.escrow,
    funder: raw.funder,
    developer: raw.developer,
    metadataCID: raw.metadataCID,
    createdAt: raw.createdAt,
    active: raw.active,
  };
}

/* ------------------------------------------------------------------ reading */

export async function getTotalProjects(provider: Provider): Promise<bigint> {
  return getEscrowFactory(provider).totalProjects();
}

/**
 * Fee terms, read from the factory rather than assumed.
 *
 * These are immutables of this particular deployment, so the interface quotes
 * what the contract will actually charge instead of a mirrored constant that
 * could silently be wrong if the address in `config.ts` ever changes.
 */
export async function fetchFactoryTerms(
  provider: Provider,
): Promise<{ feeBps: bigint; feeRecipient: string }> {
  const factory = getEscrowFactory(provider);
  const [feeBps, feeRecipient] = await Promise.all([
    factory.feeBps() as Promise<bigint>,
    factory.feeRecipient() as Promise<string>,
  ]);
  return { feeBps, feeRecipient };
}

/**
 * A page of projects, newest first.
 *
 * One call. The previous registry returned ids only, so listing cost a further
 * RPC read per id.
 */
export async function getAllProjects(
  provider: Provider,
  offset: number,
  limit: number,
): Promise<FactoryProject[]> {
  const total = await getTotalProjects(provider);
  if (BigInt(offset) >= total) return [];

  const raw = (await getEscrowFactory(provider).getProjects(offset, limit)) as Parameters<
    typeof toFactoryProject
  >[0][];

  // The contract walks backwards from the end, so entry `i` of the page is
  // id `total - 1 - (offset + i)`.
  return raw.map((project, i) => toFactoryProject(project, total - 1n - BigInt(offset + i)));
}

export async function getProject(
  projectId: bigint,
  provider: Provider,
): Promise<FactoryProject> {
  return toFactoryProject(await getEscrowFactory(provider).getProject(projectId), projectId);
}

/** Every project a wallet funds or builds, resolved in a single call. */
export async function getProjectsForUser(
  address: string,
  provider: Provider,
): Promise<FactoryProject[]> {
  const factory = getEscrowFactory(provider);
  const raw = (await factory.getProjectsByUser(address)) as Parameters<
    typeof toFactoryProject
  >[0][];

  // `getProjectsByUser` returns the structs but not their ids. The id is only
  // needed to link to a project, and `projectIdOf` resolves it from the escrow
  // address in one batched round-trip.
  const ids = await Promise.all(
    raw.map((project) => factory.projectIdOf(project.escrow) as Promise<bigint>),
  );

  return raw.map((project, i) => toFactoryProject(project, ids[i]));
}

/** True only for escrows this factory deployed. */
export async function isOfficialEscrow(
  escrowAddress: string,
  provider: Provider,
): Promise<boolean> {
  return getEscrowFactory(provider).isOfficialEscrow(escrowAddress);
}

/* ------------------------------------------------------------------ writing */

export interface CreateEscrowParams {
  developer: string;
  token: string;
  /** Deadlines are mandatory and must be in the future; the constructor reverts otherwise. */
  milestones: { amount: bigint; deadline: bigint }[];
  metadataCID: string;
}

/**
 * Deploys an escrow and indexes it, in one transaction.
 *
 * The caller becomes the funder. Setting a project up used to take four
 * transactions — deploy, register, approve, deposit. This removes the second,
 * and `fundWithPermit` removes the third.
 */
export async function createEscrow(
  signer: Signer,
  params: CreateEscrowParams,
): Promise<{ address: string; projectId: bigint; tx: ContractTransactionResponse }> {
  const factory = getEscrowFactory(signer);

  const amounts = params.milestones.map((m) => m.amount);
  const deadlines = params.milestones.map((m) => m.deadline);

  // The return values are only observable by simulating first — a transaction
  // response carries no return data. This costs no gas and reverts here, with
  // the contract's own error, rather than after the user has paid for it.
  const [address, projectId] = (await factory.createEscrow.staticCall(
    params.developer,
    params.token,
    amounts,
    deadlines,
    params.metadataCID,
  )) as [string, bigint];

  const tx = (await factory.createEscrow(
    params.developer,
    params.token,
    amounts,
    deadlines,
    params.metadataCID,
  )) as ContractTransactionResponse;

  return { address, projectId, tx };
}

/** Repoints a project's metadata. Only its funder may call this. */
export function setProjectMetadata(
  signer: Signer,
  projectId: bigint,
  metadataCID: string,
): Promise<ContractTransactionResponse> {
  return getEscrowFactory(signer).setMetadata(projectId, metadataCID);
}

/** Hides a project from listings. The escrow itself is untouched. */
export function deactivateProject(
  signer: Signer,
  projectId: bigint,
): Promise<ContractTransactionResponse> {
  return getEscrowFactory(signer).deactivate(projectId);
}
