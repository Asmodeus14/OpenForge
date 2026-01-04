// flows/getProfileFlow.ts

import { getProfileRegistry } from "../contracts/getprofileRegistry";

export async function getProfileFlow(user: string) {
  const registry = await getProfileRegistry();

  const hasProfile = await registry.hasProfile(user);
  if (!hasProfile) return null;

  const cid = await registry.getProfile(user);
  return cid; // frontend will resolve IPFS
}
