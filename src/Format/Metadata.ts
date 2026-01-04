export interface AvatarMetadata {
  cid: string;
  type: "avatar";
}

export interface ProfileMetadata {
  type: "profile";
  version: "1.0";
  name: string;
  bio: string;
  skills: string[];
  avatar?: AvatarMetadata;
  createdAt: number;
  updatedAt?: number;
  walletAddress: string;
}

/**
 * Fully resolved profile (on-chain + IPFS)
 */
export interface ResolvedProfile {
  cid: string;
  wallet: string;
  metadata: ProfileMetadata;
}
