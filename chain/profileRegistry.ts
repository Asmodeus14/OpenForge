/**
 * ProfileRegistry — wallet → IPFS CID for profile metadata.
 *
 * Reads use the read-only provider, so viewing a public profile no longer
 * requires the viewer to have a wallet connected.
 *
 * The contract enforces a hard 14-day cooldown between profile edits, with no
 * owner and no override. `getUpdateAvailability` exposes that so the UI can
 * tell the user before they fill in a form, instead of after a revert.
 */

import { Contract, type ContractTransactionResponse, type Provider, type Signer } from 'ethers';
import { ProfileRegistryABI } from './abi/profileRegistry';
import { DEFAULT_CHAIN, PROTOCOL } from './config';

export interface ProfileMetadata {
  type: 'profile';
  version: string;
  name: string;
  bio: string;
  skills: string[];
  avatar?: { cid: string; type: 'avatar' };
  location?: string;
  website?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  createdAt?: number;
  updatedAt?: number;
}

export function getProfileRegistry(runner: Provider | Signer): Contract {
  return new Contract(
    DEFAULT_CHAIN.contracts.profileRegistry,
    ProfileRegistryABI,
    runner,
  );
}

export async function hasProfile(address: string, provider: Provider): Promise<boolean> {
  return getProfileRegistry(provider).hasProfile(address);
}

/**
 * Returns the profile's metadata CID, or `null` if the wallet has none.
 *
 * The two reads are issued together rather than one after the other. Awaiting
 * `hasProfile` before starting `getProfile` made this two HTTP round trips;
 * concurrently, ethers folds them into a single JSON-RPC batch. Measured
 * against Sepolia: ~800ms sequential, ~400ms batched, for a call that costs
 * ~180ms at the wire.
 *
 * `getProfile` is therefore fetched even for wallets that turn out to have no
 * profile. That result is discarded — `hasProfile` still decides — and it
 * costs nothing extra, because it travels in a batch that was already being
 * sent.
 */
export async function getProfileCid(
  address: string,
  provider: Provider,
): Promise<string | null> {
  const registry = getProfileRegistry(provider);

  const [exists, cid] = await Promise.all([
    registry.hasProfile(address) as Promise<boolean>,
    // `getProfile` reverts with "Profile not found" for a wallet that has
    // none, which is why it cannot simply replace `hasProfile` — and why
    // awaiting it unguarded would turn the ordinary "no profile" case into a
    // thrown error. Swallowed here because `hasProfile`, travelling in the
    // same batch, is what decides. A genuine RPC failure still surfaces,
    // because it fails that call too.
    (registry.getProfile(address) as Promise<string>).catch(() => null),
  ]);

  return exists ? cid : null;
}

export interface UpdateAvailability {
  canUpdate: boolean;
  /** Unix seconds when the next edit becomes possible. */
  availableAt: bigint;
  lastUpdated: bigint;
}

/**
 * When this wallet may next edit its profile.
 *
 * Surfaced before the edit form is submitted — the cooldown was previously
 * only discovered by parsing the revert message after a failed transaction.
 */
export async function getUpdateAvailability(
  address: string,
  provider: Provider,
): Promise<UpdateAvailability> {
  const lastUpdated = (await getProfileRegistry(provider).lastUpdated(address)) as bigint;
  const availableAt = lastUpdated + PROTOCOL.profileUpdateCooldownSeconds;
  const now = BigInt(Math.floor(Date.now() / 1000));
  return {
    canUpdate: lastUpdated === 0n || now >= availableAt,
    availableAt,
    lastUpdated,
  };
}

/* ------------------------------------------------------------------ writing */

export function createProfile(
  signer: Signer,
  metadataCid: string,
): Promise<ContractTransactionResponse> {
  return getProfileRegistry(signer).createProfile(metadataCid);
}

export function updateProfile(
  signer: Signer,
  metadataCid: string,
): Promise<ContractTransactionResponse> {
  return getProfileRegistry(signer).updateProfile(metadataCid);
}

/**
 * Builds the metadata document that gets pinned to IPFS.
 *
 * `createdAt` is preserved across updates. The previous implementation wrote
 * `createdAt: isUpdate ? undefined! : now`, which dropped the key on every
 * edit and permanently destroyed the original creation date.
 */
export function buildProfileMetadata(input: {
  name: string;
  bio: string;
  skills: string[];
  avatarCid?: string;
  previousCreatedAt?: number;
}): ProfileMetadata {
  const now = Date.now();
  const isUpdate = input.previousCreatedAt !== undefined;

  return {
    type: 'profile',
    version: '1.0',
    name: input.name,
    bio: input.bio,
    skills: input.skills,
    ...(input.avatarCid ? { avatar: { cid: input.avatarCid, type: 'avatar' as const } } : {}),
    createdAt: input.previousCreatedAt ?? now,
    ...(isUpdate ? { updatedAt: now } : {}),
  };
}
