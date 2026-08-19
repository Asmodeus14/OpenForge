import 'server-only';

import { getReadProvider } from '@/chain/clients';
import { getProfileCid } from '@/chain/profileRegistry';
import { fetchIpfsJson, ipfsUrl } from '@/lib/ipfs';
import { parseProfileMetadata } from '@/lib/profile';
import type { ProfileMetadata } from '@/chain/profileRegistry';

/**
 * Server-side profile loading.
 *
 * A public profile is a page other people are sent a link to, so it is
 * rendered on the server: it works without JavaScript, it is indexable, and
 * the first paint already has the content rather than a spinner followed by
 * an RPC round-trip.
 */

export interface LoadedProfile {
  address: string;
  cid: string;
  metadata: ProfileMetadata;
  avatarUrl?: string;
}

/**
 * Returns `null` when the wallet has no profile, and throws only when the
 * chain or gateway is genuinely unreachable — the caller distinguishes
 * "nobody is here" from "we could not find out".
 */
export async function loadProfile(address: string): Promise<LoadedProfile | null> {
  const cid = await getProfileCid(address, getReadProvider());
  if (!cid) return null;

  const metadata = parseProfileMetadata(await fetchIpfsJson(cid));
  if (!metadata) return null;

  return {
    address,
    cid,
    metadata,
    avatarUrl: metadata.avatar?.cid ? ipfsUrl(metadata.avatar.cid) : undefined,
  };
}

/* ------------------------------------------------------------------- seeds */

/** What `Person` actually renders. Deliberately not the whole profile. */
export interface ProfileSeed {
  name: string | null;
  avatarUrl?: string;
}

/** Keyed on the lowercased address, since callers vary in casing. */
export type ProfileSeedMap = Record<string, ProfileSeed | null>;

/**
 * Resolves many profiles at once, for pages that already render a list of
 * addresses on the server.
 *
 * `Person` resolves each address it is given through react-query, which is
 * right for a page that discovers addresses as it goes but wasteful for one
 * that knew all of them before it rendered: `/funding` shows two people per
 * row, so a hundred escrows meant two hundred client-side lookups, each an
 * IPFS fetch, on a page that was otherwise fully server-rendered. The RPC half
 * was already batched by the shared provider; the gateway fetches were not.
 *
 * Addresses are deduplicated first — the same funder across ten rows is one
 * lookup, not ten.
 *
 * An address that fails to resolve is **omitted** rather than stored as null.
 * Null is meaningful here: it means "resolved, and this wallet has no
 * profile", which stops the client re-querying. Omission lets the client
 * retry, so a gateway hiccup during the server render degrades to the old
 * behaviour instead of showing a bare address permanently.
 */
export async function loadProfileSeeds(
  addresses: readonly (string | null | undefined)[],
): Promise<ProfileSeedMap> {
  const unique = Array.from(
    new Set(addresses.filter((a): a is string => Boolean(a)).map((a) => a.toLowerCase())),
  );

  const resolved = await Promise.all(
    unique.map(async (address) => {
      try {
        const profile = await loadProfile(address);
        const seed: ProfileSeed | null = profile
          ? {
              name: profile.metadata.name?.trim() || null,
              avatarUrl: profile.avatarUrl,
            }
          : null;
        return [address, seed] as const;
      } catch {
        return null;
      }
    }),
  );

  return Object.fromEntries(resolved.filter((entry) => entry !== null));
}
