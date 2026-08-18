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
import { calculateNetAmount, DEFAULT_CHAIN, type TokenInfo } from '@/chain/config';
import { fetchEscrowDetail, type EscrowDetail } from '@/chain/escrow';
import {
  estimateDeployPreflight,
  specToParams,
  type DeploySpec,
  type GasPreflight,
} from '@/chain/gas';
import { getAllowance, getBalance, getTokenInfo } from '@/chain/erc20';
import { getAddressActivity, type AddressActivity } from '@/chain/identity';
import { getProjectsForUser, getAllProjects, type RegistryProject } from '@/chain/escrowRegistry';
import { EscrowState, isTerminalEscrowState } from '@/lib/status';
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

/**
 * How often to re-read state that somebody else can change.
 *
 * Only for data whose value can move while the user sits and looks at it —
 * the funder releasing a milestone, a dispute being raised, a new escrow
 * naming you as the developer. Everything else refetches when the tab regains
 * focus, which is enough.
 *
 * react-query pauses these timers while the tab is in the background
 * (`refetchIntervalInBackground` defaults to false), so an idle tab costs
 * nothing.
 */
const LIVE_POLL_MS = 20_000;
const SLOW_POLL_MS = 60_000;
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
  addressActivity: (address?: string | null) =>
    ['address-activity', address?.toLowerCase()] as const,
  nativeBalance: (address?: string | null) =>
    ['native-balance', address?.toLowerCase()] as const,
  tokenBalances: (address?: string | null) =>
    ['token-balances', address?.toLowerCase()] as const,
  escrowHoldings: (address?: string | null) =>
    ['escrow-holdings', address?.toLowerCase()] as const,
  tokenInfo: (address?: string | null) => ['token-info', address?.toLowerCase()] as const,
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
    // A funder can name you as the developer of an escrow at any moment, and
    // it should appear without being asked for.
    refetchInterval: SLOW_POLL_MS,
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
    // The page where watching matters: the other party can fund, release,
    // cancel or dispute while you have it open, and every one of those
    // changes what you are allowed to do next.
    //
    // A settled escrow is not polled. Completed and Cancelled are terminal in
    // the contract, so there is nothing left that could change and repeating
    // the read forever would be pure waste.
    refetchInterval: (query) =>
      query.state.data && isTerminalEscrowState(query.state.data.state)
        ? false
        : LIVE_POLL_MS,
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

/**
 * Symbol, name and decimals for any ERC20 address.
 *
 * Known tokens resolve from the config table without an RPC call; anything
 * else is probed. `getTokenInfo` throws `UnreadableTokenError` rather than
 * assuming 18 decimals, so a token that will not identify itself surfaces as
 * an error the user can see instead of amounts that are silently wrong by
 * orders of magnitude.
 *
 * Not retried: the failure is a property of the contract, not of the network,
 * so retrying only delays the message.
 */
export function useTokenInfo(address?: string | null) {
  return useQuery<TokenInfo>({
    queryKey: queryKeys.tokenInfo(address),
    enabled: Boolean(address),
    // Token metadata is immutable in every sane implementation.
    staleTime: Infinity,
    retry: false,
    queryFn: () => getTokenInfo(address!, getReadProvider(), DEFAULT_CHAIN.chainId),
  });
}

/* --------------------------------------------------------------------- gas */

/**
 * Prices the four-transaction deploy sequence before any of it is sent.
 *
 * Only enabled once the form is valid, because estimating an incomplete
 * configuration means asking the node to price a transaction that would
 * revert. Callers should pass a deferred copy of the parameters so a burst of
 * typing coalesces into one estimate instead of one per keystroke.
 */
export function useDeployGasPreflight({
  account,
  spec,
  totalAmount,
  enabled,
}: {
  account?: string | null;
  spec: DeploySpec | null;
  totalAmount: bigint;
  enabled: boolean;
}) {
  return useQuery<GasPreflight>({
    queryKey: [
      'gas-preflight',
      account?.toLowerCase(),
      spec?.developer.toLowerCase(),
      spec?.token.toLowerCase(),
      // Amounts, deadlines and descriptions all change the calldata, and
      // therefore the gas. Days rather than timestamps, so the key is stable
      // between renders instead of moving with the clock.
      spec?.milestones.map((m) => `${m.amount}:${m.days}:${m.description}`).join('|'),
    ],
    enabled: enabled && Boolean(account && spec),
    // Gas price moves every block; a short window keeps the figure current
    // without re-estimating on every render.
    staleTime: 30_000,
    retry: false,
    queryFn: () =>
      estimateDeployPreflight({
        provider: getReadProvider(),
        account: account!,
        // Resolved here rather than in render — see `specToParams`.
        params: specToParams(spec!),
        totalAmount,
      }),
  });
}

/* ---------------------------------------------------------------- identity */

/**
 * Whether an address is a contract, and how much it has been used.
 *
 * Read before paying someone. Both facts come straight from the node and
 * cannot be spoofed, which is exactly why they are worth showing next to a
 * profile name, which can.
 */
export function useAddressActivity(address?: string | null, enabled = true) {
  return useQuery<AddressActivity>({
    queryKey: queryKeys.addressActivity(address),
    enabled: Boolean(address) && enabled,
    staleTime: CHAIN_STALE_MS,
    queryFn: () => getAddressActivity(address!, getReadProvider()),
  });
}

/* ---------------------------------------------------------------- balances */

/** Native balance — what pays for gas, and therefore what blocks a deploy. */
export function useNativeBalance(address?: string | null, enabled = true) {
  return useQuery<bigint>({
    queryKey: queryKeys.nativeBalance(address),
    enabled: Boolean(address) && enabled,
    staleTime: 10_000,
    queryFn: () => getReadProvider().getBalance(address!),
  });
}

export interface TokenBalance {
  token: TokenInfo;
  balance: bigint;
}

/**
 * Balances of every token this chain's escrow accepts, in one query so the
 * whole panel resolves together rather than row by row.
 */
export function useTokenBalances(address?: string | null, enabled = true) {
  return useQuery<TokenBalance[]>({
    queryKey: queryKeys.tokenBalances(address),
    enabled: Boolean(address) && enabled,
    staleTime: 10_000,
    queryFn: async () => {
      const provider = getReadProvider();
      return Promise.all(
        DEFAULT_CHAIN.tokens.map(async (token) => ({
          token,
          balance: await getBalance(token.address, address!, provider),
        })),
      );
    },
  });
}

export interface EscrowHolding {
  token: TokenInfo;
  /** Your own money sitting in escrows you fund. Still yours until released. */
  lockedAsFunder: bigint;
  /**
   * Net still assigned to you across escrows where you are the developer.
   * Assigned is not the same as earned — the funder controls every release,
   * and can cancel an overdue milestone or win a dispute. Label accordingly.
   */
  committedToYou: bigint;
}

/**
 * What the connected wallet has tied up in escrow contracts.
 *
 * Deliberately opt-in via `enabled`: it costs one registry call plus one read
 * per escrow, which is not worth spending until someone actually opens the
 * panel that shows it.
 */
export function useEscrowHoldings(address?: string | null, enabled = true) {
  return useQuery<EscrowHolding[]>({
    queryKey: queryKeys.escrowHoldings(address),
    enabled: Boolean(address) && enabled,
    staleTime: CHAIN_STALE_MS,
    queryFn: async () => {
      const provider = getReadProvider();
      const lower = address!.toLowerCase();

      const projects = await getProjectsForUser(address!, provider);
      const details = await Promise.all(
        projects.map((project) =>
          // An unreadable escrow is omitted rather than failing the panel.
          fetchEscrowDetail(project.escrowAddress, provider, DEFAULT_CHAIN.chainId).catch(
            () => null,
          ),
        ),
      );

      const byToken = new Map<string, EscrowHolding>();

      for (const detail of details) {
        if (!detail) continue;

        const key = detail.paymentToken.toLowerCase();
        const entry = byToken.get(key) ?? {
          token: detail.token,
          lockedAsFunder: 0n,
          committedToYou: 0n,
        };

        if (detail.funder.toLowerCase() === lower) {
          // The live token balance, not the configured total — money already
          // released or returned is no longer held here.
          entry.lockedAsFunder += detail.contractBalance;
        }

        if (detail.developer.toLowerCase() === lower) {
          // Only an escrow that actually holds funds can pay anything out.
          const payable =
            detail.state === EscrowState.Funded || detail.state === EscrowState.Disputed;
          if (payable) {
            entry.committedToYou += detail.milestones
              .filter((milestone) => !milestone.released && !milestone.cancelled)
              .reduce((sum, milestone) => sum + calculateNetAmount(milestone.amount), 0n);
          }
        }

        byToken.set(key, entry);
      }

      return [...byToken.values()].filter(
        (holding) => holding.lockedAsFunder > 0n || holding.committedToYou > 0n,
      );
    },
  });
}
