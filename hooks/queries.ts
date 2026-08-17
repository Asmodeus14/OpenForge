'use client';

/**
 * Chain and IPFS data hooks, backed by react-query.
 *
 * react-query was already a dependency but entirely unwired — there was no
 * QueryClientProvider. Adopting it here gives every async surface the same
 * loading / error / retry / cache behaviour instead of each page hand-rolling
 * `useState` + `useEffect` with its own bugs (the previous `useProfile` cache,
 * for instance, was declared inside the hook body and therefore never
 * persisted across renders).
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getReadProvider } from '@/chain/clients';
import { DEFAULT_CHAIN } from '@/chain/config';
import { fetchEscrowDetail, type EscrowDetail } from '@/chain/escrow';
import { getAllowance, getBalance } from '@/chain/erc20';
import { getProjectsForUser, getAllProjects, type RegistryProject } from '@/chain/escrowRegistry';
import {
  getProfileCid,
  getUpdateAvailability,
  type ProfileMetadata,
  type UpdateAvailability,
} from '@/chain/profileRegistry';
import {
  getProject,
  getProjectsByBuilder,
  getRecentProjects,
  type ChainProject,
} from '@/chain/projectRegistry';
import { fetchIpfsJson, ipfsUrl } from '@/lib/ipfs';

/** Chain data is not real-time; a short stale window avoids refetch storms. */
const CHAIN_STALE_MS = 30_000;
/** IPFS content at a CID is immutable, so it can be cached indefinitely. */
const IPFS_STALE_MS = Infinity;

export const queryKeys = {
  profile: (address?: string | null) => ['profile', address?.toLowerCase()] as const,
  profileCooldown: (address?: string | null) =>
    ['profile-cooldown', address?.toLowerCase()] as const,
  projects: (offset: number, limit: number) => ['projects', offset, limit] as const,
  project: (id: number) => ['project', id] as const,
  projectsByBuilder: (address?: string | null) =>
    ['projects-by-builder', address?.toLowerCase()] as const,
  ipfs: (cid?: string | null) => ['ipfs', cid] as const,
  escrowProjects: (address?: string | null) =>
    ['escrow-projects', address?.toLowerCase()] as const,
  escrowProjectsAll: () => ['escrow-projects-all'] as const,
  escrow: (address?: string | null) => ['escrow', address?.toLowerCase()] as const,
  allowance: (token?: string | null, owner?: string | null, spender?: string | null) =>
    ['allowance', token?.toLowerCase(), owner?.toLowerCase(), spender?.toLowerCase()] as const,
} as const;

/* ---------------------------------------------------------------- profiles */

export interface ResolvedProfile {
  address: string;
  cid: string;
  metadata: ProfileMetadata;
  avatarUrl?: string;
}

/**
 * Resolves a wallet's profile: registry lookup, then IPFS.
 *
 * Returns `null` (not an error) when the wallet simply has no profile — that
 * is an ordinary state deserving an empty state, not an error state.
 */
export function useProfile(address?: string | null) {
  return useQuery<ResolvedProfile | null>({
    queryKey: queryKeys.profile(address),
    enabled: Boolean(address),
    staleTime: CHAIN_STALE_MS,
    queryFn: async () => {
      const cid = await getProfileCid(address!, getReadProvider());
      if (!cid) return null;

      const metadata = await fetchIpfsJson<ProfileMetadata>(cid);
      return {
        address: address!,
        cid,
        metadata,
        avatarUrl: metadata.avatar?.cid ? ipfsUrl(metadata.avatar.cid) : undefined,
      };
    },
  });
}

/** When this wallet may next edit its profile (14-day contract cooldown). */
export function useProfileCooldown(address?: string | null) {
  return useQuery<UpdateAvailability>({
    queryKey: queryKeys.profileCooldown(address),
    enabled: Boolean(address),
    staleTime: CHAIN_STALE_MS,
    queryFn: () => getUpdateAvailability(address!, getReadProvider()),
  });
}

/* ---------------------------------------------------------------- projects */

export function useRecentProjects(offset = 0, limit = 12) {
  return useQuery({
    queryKey: queryKeys.projects(offset, limit),
    staleTime: CHAIN_STALE_MS,
    queryFn: () => getRecentProjects(getReadProvider(), offset, limit),
  });
}

export function useProject(projectId?: number) {
  return useQuery<ChainProject>({
    queryKey: queryKeys.project(projectId ?? -1),
    enabled: projectId !== undefined && projectId >= 0,
    staleTime: CHAIN_STALE_MS,
    queryFn: () => getProject(projectId!, getReadProvider()),
  });
}

export function useProjectsByBuilder(address?: string | null) {
  return useQuery<ChainProject[]>({
    queryKey: queryKeys.projectsByBuilder(address),
    enabled: Boolean(address),
    staleTime: CHAIN_STALE_MS,
    queryFn: () => getProjectsByBuilder(getReadProvider(), address!),
  });
}

/* -------------------------------------------------------------------- IPFS */

/**
 * Fetches a JSON document by CID. Content at a CID never changes, so this is
 * cached for the session — the same avatar or project metadata is fetched
 * once no matter how many components ask for it.
 */
export function useIpfsJson<T = unknown>(
  cid?: string | null,
  options?: Partial<UseQueryOptions<T>>,
) {
  return useQuery<T>({
    queryKey: queryKeys.ipfs(cid),
    enabled: Boolean(cid),
    staleTime: IPFS_STALE_MS,
    gcTime: IPFS_STALE_MS,
    retry: 1,
    queryFn: () => fetchIpfsJson<T>(cid!),
    ...options,
  });
}

/* ------------------------------------------------------------------ escrow */

export function useEscrowProjects(address?: string | null) {
  return useQuery<RegistryProject[]>({
    queryKey: queryKeys.escrowProjects(address),
    enabled: Boolean(address),
    staleTime: CHAIN_STALE_MS,
    queryFn: () => getProjectsForUser(address!, getReadProvider()),
  });
}

export function useAllEscrowProjects(limit = 50) {
  return useQuery<RegistryProject[]>({
    queryKey: queryKeys.escrowProjectsAll(),
    staleTime: CHAIN_STALE_MS,
    queryFn: () => getAllProjects(getReadProvider(), 0, limit),
  });
}

/** Full on-chain state of a single escrow, including its milestones. */
export function useEscrow(escrowAddress?: string | null) {
  return useQuery<EscrowDetail>({
    queryKey: queryKeys.escrow(escrowAddress),
    enabled: Boolean(escrowAddress),
    staleTime: CHAIN_STALE_MS,
    queryFn: () =>
      fetchEscrowDetail(escrowAddress!, getReadProvider(), DEFAULT_CHAIN.chainId),
  });
}

/**
 * How much of a token a spender is currently permitted to move.
 *
 * Read before offering to fund, so an already-sufficient approval does not
 * cost the user a second wallet prompt and a second gas fee. Not cached for
 * long — an approval made in another tab must be seen quickly.
 */
export function useTokenAllowance(
  tokenAddress?: string | null,
  owner?: string | null,
  spender?: string | null,
) {
  return useQuery<bigint>({
    queryKey: queryKeys.allowance(tokenAddress, owner, spender),
    enabled: Boolean(tokenAddress && owner && spender),
    staleTime: 10_000,
    queryFn: () => getAllowance(tokenAddress!, owner!, spender!, getReadProvider()),
  });
}

/** The connected wallet's balance of a token, for pre-flight checks. */
export function useTokenBalance(tokenAddress?: string | null, owner?: string | null) {
  return useQuery<bigint>({
    queryKey: ['token-balance', tokenAddress?.toLowerCase(), owner?.toLowerCase()],
    enabled: Boolean(tokenAddress && owner),
    staleTime: 10_000,
    queryFn: () => getBalance(tokenAddress!, owner!, getReadProvider()),
  });
}
