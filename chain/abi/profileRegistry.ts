// contracts/ProfileRegistryABI.ts
export const PROFILE_CONTRACT_ADDRESS =
  "0xb8c5a55D3b0E838e2f96cBdF893f90c5362F3E46";

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
