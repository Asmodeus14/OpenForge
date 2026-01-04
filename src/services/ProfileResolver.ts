import type { ProfileMetadata, ResolvedProfile } from "../Format/Metadata.ts";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

async function fetchFromIPFS<T>(cid: string): Promise<T> {
  const res = await fetch(`${IPFS_GATEWAY}${cid}`, {
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch IPFS data");
  }

  return res.json();
}

/**
 * Resolve profile from wallet → contract → IPFS → typed object
 */
export async function resolveProfile(
  wallet: string,
  getProfileCid: (wallet: string) => Promise<string | null>
): Promise<ResolvedProfile | null> {
  // 1. Fetch CID from contract
  const cid = await getProfileCid(wallet);
  if (!cid) return null;

  // 2. Fetch metadata from IPFS
  const metadata = await fetchFromIPFS<ProfileMetadata>(cid);

  // 3. Minimal validation
  if (
    metadata.type !== "profile" ||
    !metadata.name ||
    !metadata.bio ||
    !Array.isArray(metadata.skills)
  ) {
    throw new Error("Invalid profile metadata format");
  }

  // 4. Return normalized object
  return {
    cid,
    wallet,
    metadata
  };
}
