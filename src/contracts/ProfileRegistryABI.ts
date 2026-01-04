// contracts/ProfileRegistryABI.ts
export const PROFILE_CONTRACT_ADDRESS =
  "0x13f307dd0E3e46c22DD04b6D492d7B62B86C0f37";

export const ProfileRegistryABI = [
  // Functions
  "function createProfile(string cid) external",
  "function updateProfile(string newCid) external",
  "function getProfile(address user) external view returns (string)",
  "function hasProfile(address user) external view returns (bool)",
  "function lastUpdated(address user) external view returns (uint256)",
  "function UPDATE_COOLDOWN() external view returns (uint256)",

  // Events
  "event ProfileCreated(address indexed user, string cid)",
  "event ProfileUpdated(address indexed user, string oldCid, string newCid)"
];

export interface ProfileMetadata {
  type: "profile";
  version: string;
  name: string;
  bio: string;
  skills: string[];

  location?: string;
  website?: string;
  twitter?: string;
  github?: string;
  discord?: string;

  avatar?: {
    cid: string;
    type: "avatar";
  };

  createdAt: number;
  updatedAt?: number;
}
