/**
 * ProjectRegistry — metadata-only projects (builder + IPFS CID + status).
 *
 * Separate from the escrow registry; see the note in `escrowRegistry.ts`.
 *
 * The contract exposes no enumeration function, so listing means walking
 * `0 .. nextProjectId - 1`. That is done in parallel batches here rather than
 * the sequential per-project loop it replaces.
 */

import { Contract, type ContractTransactionResponse, type Provider, type Signer } from 'ethers';
import { ProjectRegistryABI } from './abi/projectRegistry';
import { ProjectStatus } from '@/lib/status';
import { DEFAULT_CHAIN } from './config';

export interface ChainProject {
  projectId: number;
  builder: string;
  metadataCid: string;
  status: ProjectStatus;
}

export function getProjectRegistry(runner: Provider | Signer): Contract {
  return new Contract(
    DEFAULT_CHAIN.contracts.projectRegistry,
    ProjectRegistryABI,
    runner,
  );
}

export async function getNextProjectId(provider: Provider): Promise<number> {
  return Number(await getProjectRegistry(provider).nextProjectId());
}

export async function getProject(
  projectId: number,
  provider: Provider,
): Promise<ChainProject> {
  const [builder, metadataCid, status] = await getProjectRegistry(provider).getProject(
    projectId,
  );
  return {
    projectId,
    builder,
    metadataCid,
    status: Number(status) as ProjectStatus,
  };
}

/**
 * Reads a contiguous range of project IDs in parallel.
 *
 * Projects that fail to load are omitted, so one bad entry cannot break a
 * whole page of results.
 */
export async function getProjectRange(
  provider: Provider,
  fromId: number,
  toIdExclusive: number,
): Promise<ChainProject[]> {
  const registry = getProjectRegistry(provider);
  const ids = Array.from(
    { length: Math.max(0, toIdExclusive - fromId) },
    (_, i) => fromId + i,
  );

  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const [builder, metadataCid, status] = await registry.getProject(id);
        return {
          projectId: id,
          builder,
          metadataCid,
          status: Number(status) as ProjectStatus,
        };
      } catch {
        return null;
      }
    }),
  );

  return results.filter((p): p is ChainProject => p !== null);
}

/** Newest-first page of projects. */
export async function getRecentProjects(
  provider: Provider,
  offset: number,
  limit: number,
): Promise<{ projects: ChainProject[]; total: number; hasMore: boolean }> {
  const total = await getNextProjectId(provider);
  const end = total - offset;
  const start = Math.max(0, end - limit);
  if (end <= 0) return { projects: [], total, hasMore: false };

  const projects = await getProjectRange(provider, start, end);
  projects.sort((a, b) => b.projectId - a.projectId);
  return { projects, total, hasMore: start > 0 };
}

export async function getProjectsByBuilder(
  provider: Provider,
  builder: string,
): Promise<ChainProject[]> {
  const total = await getNextProjectId(provider);
  const all = await getProjectRange(provider, 0, total);
  const lower = builder.toLowerCase();
  return all
    .filter((p) => p.builder.toLowerCase() === lower)
    .sort((a, b) => b.projectId - a.projectId);
}

/* ------------------------------------------------------------------ writing */

export function registerProject(
  signer: Signer,
  metadataCid: string,
): Promise<ContractTransactionResponse> {
  return getProjectRegistry(signer).registerProject(metadataCid);
}

/** Permitted only while the project is a Draft. */
export function updateProjectMetadata(
  signer: Signer,
  projectId: number,
  metadataCid: string,
): Promise<ContractTransactionResponse> {
  return getProjectRegistry(signer).updateProjectMetadata(projectId, metadataCid);
}

/** Draft→Funding and Funding→{Completed,Failed} only; both end states final. */
export function updateProjectStatus(
  signer: Signer,
  projectId: number,
  status: ProjectStatus,
): Promise<ContractTransactionResponse> {
  return getProjectRegistry(signer).updateProjectStatus(projectId, status);
}
