/**
 * OpenForgeProjectRegistry — the index of deployed escrows.
 *
 * Note this is a different contract from `projectRegistry.ts`. The two are
 * disjoint by design in the deployed system: project IDs here start at 1 and
 * refer to escrow-backed projects; IDs there start at 0 and refer to
 * metadata-only projects. They share no state. This module does not attempt
 * to reconcile them.
 */

import { Contract, type ContractTransactionResponse, type Provider, type Signer } from 'ethers';
import { OpenForgeProjectRegistryABI } from '../ESCROW/ABI';
import { DEFAULT_CHAIN } from './config';

export interface RegistryProject {
  projectId: bigint;
  escrowAddress: string;
  funder: string;
  developer: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: bigint;
  updatedAt: bigint;
  active: boolean;
}

export function getEscrowRegistry(runner: Provider | Signer): Contract {
  return new Contract(
    DEFAULT_CHAIN.contracts.escrowRegistry,
    OpenForgeProjectRegistryABI,
    runner,
  );
}

function toRegistryProject(raw: {
  projectId: bigint;
  escrowAddress: string;
  funder: string;
  developer: string;
  title: string;
  description: string;
  tags: readonly string[];
  createdAt: bigint;
  updatedAt: bigint;
  active: boolean;
}): RegistryProject {
  return {
    projectId: raw.projectId,
    escrowAddress: raw.escrowAddress,
    funder: raw.funder,
    developer: raw.developer,
    title: raw.title,
    description: raw.description,
    tags: [...raw.tags],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    active: raw.active,
  };
}

export async function getProjectIdsForUser(
  address: string,
  provider: Provider,
): Promise<bigint[]> {
  const ids = (await getEscrowRegistry(provider).getUserProjects(address)) as bigint[];
  return [...ids];
}

export async function getRegistryProject(
  projectId: bigint,
  provider: Provider,
): Promise<RegistryProject> {
  const raw = await getEscrowRegistry(provider).getProject(projectId);
  return toRegistryProject(raw);
}

/** Loads every escrow-backed project belonging to an address, in parallel. */
export async function getProjectsForUser(
  address: string,
  provider: Provider,
): Promise<RegistryProject[]> {
  const ids = await getProjectIdsForUser(address, provider);
  const registry = getEscrowRegistry(provider);
  const projects = await Promise.all(
    ids.map(async (id) => {
      try {
        return toRegistryProject(await registry.getProject(id));
      } catch {
        // A project that cannot be read is omitted rather than rendered blank.
        return null;
      }
    }),
  );
  return projects.filter((p): p is RegistryProject => p !== null);
}

export async function getTotalProjects(provider: Provider): Promise<bigint> {
  return getEscrowRegistry(provider).getTotalProjects();
}

/** Paginated listing. `offset` is 0-based even though project IDs start at 1. */
export async function getAllProjects(
  provider: Provider,
  offset: number,
  limit: number,
): Promise<RegistryProject[]> {
  const total = await getTotalProjects(provider);
  if (BigInt(offset) >= total) return [];
  const raw = await getEscrowRegistry(provider).getAllProjects(offset, limit);
  return (raw as Parameters<typeof toRegistryProject>[0][]).map(toRegistryProject);
}

/**
 * Registers a deployed escrow with the registry.
 *
 * Only the escrow's funder may call this. If it is skipped, the escrow has no
 * index entry and becomes undiscoverable — there is no factory event to
 * recover it from.
 */
export function registerProject(
  signer: Signer,
  escrowAddress: string,
  title: string,
  description: string,
  tags: string[],
): Promise<ContractTransactionResponse> {
  return getEscrowRegistry(signer).registerProject(escrowAddress, title, description, tags);
}
