import { useState, useEffect, useCallback } from 'react';
import { getProfileFlow } from '../Flows/GetProfile';

interface ProfileData {
  type: string;
  version: string;
  name: string;
  bio?: string;
  skills?: string[];
  avatar?: {
    cid: string;
    type: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileCache {
  [address: string]: {
    data: ProfileData | null;
    timestamp: number;
  };
}

// Cache profiles for 5 minutes
const PROFILE_CACHE_DURATION = 5 * 60 * 1000;

// Helper function to check if string is a valid Ethereum address
export const isWalletAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Helper function to format wallet address
export const formatWalletAddress = (address?: string): string => {
  if (!address) return 'Unknown';
  if (!isWalletAddress(address)) return address; // Return as-is if not a wallet address
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to get display name
export const getDisplayName = (address: string, profile?: ProfileData | null): string => {
  if (profile?.name) return profile.name;
  return formatWalletAddress(address);
};

// Helper function to get avatar URL
export const getAvatarUrl = (profile?: ProfileData | null): string | null => {
  if (profile?.avatar?.cid) {
    return `https://ipfs.io/ipfs/${profile.avatar.cid}`;
  }
  return null;
};

export const useProfile = (walletAddress?: string) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for profiles
  const cache: ProfileCache = {};

  const fetchProfile = useCallback(async (address: string) => {
    // Only fetch if it's a valid wallet address
    if (!isWalletAddress(address)) {
      setProfile(null);
      return;
    }

    // Check cache first
    const cached = cache[address];
    if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_DURATION) {
      setProfile(cached.data);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const cid = await getProfileFlow(address);
      
      if (!cid) {
        setProfile(null);
        cache[address] = { data: null, timestamp: Date.now() };
        return;
      }

      // Fetch profile data from IPFS with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(`https://ipfs.io/ipfs/${cid}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const profileData: ProfileData = await response.json();
        setProfile(profileData);
        cache[address] = { data: profileData, timestamp: Date.now() };
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Profile fetch timeout');
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
      setProfile(null);
      cache[address] = { data: null, timestamp: Date.now() };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchProfile(walletAddress);
    } else {
      setProfile(null);
    }
  }, [walletAddress, fetchProfile]);

  return { profile, loading, error, refetch: () => walletAddress && fetchProfile(walletAddress) };
};

// Profile resolver for multiple wallets with batching
export const useProfiles = (walletAddresses: string[]) => {
  const [profiles, setProfiles] = useState<Record<string, ProfileData | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (walletAddresses.length === 0) {
        setProfiles({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Filter out only valid wallet addresses and remove duplicates
        const validAddresses = Array.from(new Set(
          walletAddresses.filter(addr => isWalletAddress(addr))
        ));

        if (validAddresses.length === 0) {
          setProfiles({});
          setLoading(false);
          return;
        }

        console.log('Fetching profiles for valid addresses:', validAddresses);

        // Batch fetch profiles
        const profilePromises = validAddresses.map(async (address) => {
          try {
            const cid = await getProfileFlow(address);
            if (!cid) return [address, null];
            
            // Fetch from IPFS with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            try {
              const response = await fetch(`https://ipfs.io/ipfs/${cid}`, {
                signal: controller.signal,
              });
              clearTimeout(timeoutId);
              
              if (!response.ok) return [address, null];
              
              const profileData: ProfileData = await response.json();
              return [address, profileData];
            } catch (fetchError) {
              console.warn(`Failed to fetch IPFS data for ${address}:`, fetchError);
              return [address, null];
            }
          } catch (err) {
            console.error(`Error getting profile CID for ${address}:`, err);
            return [address, null];
          }
        });

        const results = await Promise.all(profilePromises);
        const profilesMap = Object.fromEntries(results);
        setProfiles(profilesMap);
      } catch (err: any) {
        console.error('Error fetching profiles:', err);
        setError('Failed to load profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [walletAddresses]);

  return { profiles, loading, error };
};