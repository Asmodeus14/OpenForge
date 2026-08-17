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
