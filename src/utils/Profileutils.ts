// src/utils/profileUtils.ts
// src/utils/profileUtils.ts

export interface ProcessedProfile {
  name: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
  website?: string;
  twitter?: string;
  github?: string;
  createdAt?: number;
  updatedAt?: number;
}

export function processProfileMetadata(
  metadata: any,
  address: string
): ProcessedProfile {
  // Default profile with formatted address as name
  const defaultProfile: ProcessedProfile = {
    name: formatAddress(address),
  };

  if (!metadata) return defaultProfile;

  try {
    // Handle both string JSON and object
    const profileData = typeof metadata === 'string' 
      ? JSON.parse(metadata) 
      : metadata;

    // Extract avatar URL from CID structure
    let avatarUrl = undefined;
    if (profileData.avatar) {
      if (typeof profileData.avatar === 'string') {
        // If avatar is a direct string CID
        avatarUrl = `https://ipfs.io/ipfs/${profileData.avatar}`;
      } else if (profileData.avatar.cid) {
        // If avatar is an object with cid property (from buildProfileMetadata)
        avatarUrl = `https://ipfs.io/ipfs/${profileData.avatar.cid}`;
      }
    }

    // Extract other profile fields
    const processedProfile: ProcessedProfile = {
      name: profileData.name || formatAddress(address),
      bio: profileData.bio,
      skills: profileData.skills,
      avatar: avatarUrl,
      website: profileData.website,
      twitter: profileData.twitter,
      github: profileData.github,
      createdAt: profileData.createdAt,
      updatedAt: profileData.updatedAt,
    };

    return processedProfile;
  } catch (error) {
    console.error('Error processing profile metadata:', error);
    return defaultProfile;
  }
}

function formatAddress(address: string): string {
  if (!address) return "Unknown";
  if (address.length <= 12) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}