import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import {
  User,
  Edit2,
  Check,
  X,
  Plus,
  Save,
  Loader,
  Upload,
  RefreshCw,
  Clock,
  Shield,
  Calendar,
  Link as LinkIcon,
  Github,
  Twitter,
  Linkedin,
  ExternalLink,
  Copy,
  CheckCircle,
  Zap,
  Sparkles,
  Heart
} from "lucide-react";

import { createProfileFlow } from "../Flows/CreateProfileFlow";
import { updateProfileFlow } from "../Flows/UpdateProfileFlow";
import { getProfileFlow } from "../Flows/GetProfile";
import Sidebar from "../component/Sidebar";

const COOLDOWN_PERIOD = 1209600;

interface ProfileData {
  type: string;
  version: string;
  name: string;
  bio: string;
  skills: string[];
  avatar?: {
    cid: string;
    type: string;
  };
  createdAt: number;
  walletAddress: string;
}

export default function ProfileForm() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarCid, setAvatarCid] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentCid, setCurrentCid] = useState<string>("");
  const [cooldownTime, setCooldownTime] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [bioTipsVisible, setBioTipsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("profile");

  const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

  const calculateRemainingCooldown = useCallback((): number => {
    if (!lastUpdateTime) return 0;
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - lastUpdateTime;
    return Math.max(0, COOLDOWN_PERIOD - elapsed);
  }, [lastUpdateTime]);

  const formatTime = (seconds: number): string => {
    if (seconds >= 86400) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      if (hours > 0) {
        return `${days}d ${hours}h`;
      }
      return `${days}d`;
    } else if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    }
    return `${seconds}s`;
  };

  const formatTimeHuman = (seconds: number): string => {
    if (seconds >= 86400) {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };

  useEffect(() => {
    if (!lastUpdateTime) return;

    const updateCooldown = () => {
      const remaining = calculateRemainingCooldown();
      if (remaining > 0) {
        setCooldownTime(remaining);
      } else {
        setCooldownTime(null);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);

    return () => clearInterval(interval);
  }, [lastUpdateTime, calculateRemainingCooldown]);

  const loadAvatarFromIPFS = async (cid: string): Promise<void> => {
    setAvatarLoadError(false);
    try {
      const url = `${IPFS_GATEWAY}${cid}`;
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        setAvatarPreview(url);
        return;
      }
      throw new Error("Could not load avatar");
    } catch (error) {
      console.error("Failed to load avatar:", error);
      setAvatarLoadError(true);
      setAvatarPreview("");
    }
  };

  useEffect(() => {
    async function detectWallet() {
      if (!window.ethereum) {
        setError("Please install MetaMask or another Ethereum wallet!");
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWallet(address);
        
        await fetchProfileData(address);
      } catch (error) {
        console.error("Wallet detection failed:", error);
        if (error.code === 4001) {
          setError("Please connect your wallet to continue");
        } else {
          setError("Failed to connect wallet");
        }
      }
    }

    detectWallet();
    
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          fetchProfileData(accounts[0]);
        } else {
          setWallet(null);
          resetForm();
        }
      });
    }
    
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);

  const fetchProfileData = async (address: string) => {
    if (!address) return;
    
    setIsLoadingProfile(true);
    setError(null);
    setAvatarLoadError(false);
    
    try {
      const cid = await getProfileFlow(address);
      
      if (!cid) {
        setHasProfile(false);
        setProfileData(null);
        return;
      }
      
      setCurrentCid(cid);
      setHasProfile(true);
      
      const data = await fetchFromIPFS(cid);
      
      if (data) {
        const profile: ProfileData = {
          type: data.type || "profile",
          version: data.version || "1.0",
          name: data.name || "",
          bio: data.bio || "",
          skills: data.skills || [],
          avatar: data.avatar,
          createdAt: data.createdAt || Date.now(),
          walletAddress: address
        };
        
        setProfileData(profile);
        
        setName(profile.name);
        setBio(profile.bio);
        setSkills(profile.skills);
        
        if (profile.avatar && profile.avatar.cid) {
          setAvatarCid(profile.avatar.cid);
          await loadAvatarFromIPFS(profile.avatar.cid);
        } else {
          setAvatarPreview("");
          setAvatarCid("");
        }
        
        if (data.createdAt) {
          const updateTime = Math.floor(data.createdAt / 1000);
          setLastUpdateTime(updateTime);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile data");
      setHasProfile(false);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchFromIPFS = async (cid: string): Promise<any> => {
    const url = `${IPFS_GATEWAY}${cid}`;
    
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (!data.name || !data.bio) {
          throw new Error("Invalid profile data format");
        }
        
        return data;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
    }
    
    throw new Error("Failed to fetch profile data from IPFS");
  };

  const resetForm = () => {
    setName("");
    setBio("");
    setSkills([]);
    setAvatar(null);
    setAvatarPreview("");
    setAvatarCid("");
    setProfileData(null);
    setCurrentCid("");
    setEditMode(false);
    setLastUpdateTime(null);
    setCooldownTime(null);
    setAvatarLoadError(false);
    setBioTipsVisible(true);
  };

  const enterEditMode = () => {
    if (cooldownTime && cooldownTime > 0) {
      setError(`You can update your profile again in ${formatTimeHuman(cooldownTime)}`);
      return;
    }
    setEditMode(true);
    setError(null);
  };

  const cancelEdit = () => {
    setEditMode(false);
    if (profileData) {
      setName(profileData.name);
      setBio(profileData.bio);
      setSkills(profileData.skills);
    }
    setAvatar(null);
    setAvatarLoadError(false);
    setError(null);
  };

  const addSkill = () => {
    const skill = skillInput.trim().toLowerCase();
    if (!skill || skills.includes(skill)) {
      setError("Skill already exists or is empty");
      return;
    }

    setSkills([...skills, skill]);
    setSkillInput("");
    setError(null);
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError("Please select a valid image file (PNG, JPEG, SVG, GIF, WEBP)");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      
      setAvatar(file);
      setAvatarCid("");
      setAvatarLoadError(false);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!wallet) {
      setError("Connect wallet first");
      return;
    }

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!bio.trim()) {
      setError("Bio is required");
      return;
    }

    if (skills.length === 0) {
      setError("Please add at least one skill");
      return;
    }

    if (cooldownTime && cooldownTime > 0) {
      setError(`You can update your profile again in ${formatTimeHuman(cooldownTime)}`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const profilePayload = {
        type: "profile",
        version: "1.0",
        name: name.trim(),
        bio: bio.trim(),
        skills,
        avatar: avatarCid ? {
          cid: avatarCid,
          type: "avatar"
        } : undefined,
        createdAt: profileData?.createdAt || Date.now(),
        walletAddress: wallet
      };

      if (hasProfile) {
        await updateProfileFlow({
          ...profilePayload,
          avatarFile: avatar || undefined,
          previousCid: currentCid
        });
        setSuccess("Profile updated successfully!");
        setLastUpdateTime(Math.floor(Date.now() / 1000));
      } else {
        await createProfileFlow({
          ...profilePayload,
          avatarFile: avatar || undefined
        });
        setSuccess("Profile created successfully!");
        setHasProfile(true);
      }

      await fetchProfileData(wallet);
      setEditMode(false);
      setBioTipsVisible(false);
      
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err: any) {
      console.error("Transaction error:", err);
      
      if (err?.message?.includes("cooldown") || err?.message?.includes("Cooldown")) {
        const match = err.message.match(/(\d+)\s*seconds?/);
        if (match) {
          const seconds = parseInt(match[1]);
          setCooldownTime(seconds);
          setLastUpdateTime(Math.floor(Date.now() / 1000) - (COOLDOWN_PERIOD - seconds));
          setError(`Cooldown active. Please wait ${formatTimeHuman(seconds)} before updating again`);
        } else {
          setError("Cooldown active. Please wait before updating again");
        }
      } else {
        setError(err?.message || "Transaction failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const reconnectWallet = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      setError("Failed to connect wallet");
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyWalletAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const extractLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex) || [];
    
    const links = matches.map(url => {
      if (url.includes('github.com')) {
        return { url, icon: Github, label: 'GitHub' };
      } else if (url.includes('twitter.com') || url.includes('x.com')) {
        return { url, icon: Twitter, label: 'Twitter' };
      } else if (url.includes('linkedin.com')) {
        return { url, icon: Linkedin, label: 'LinkedIn' };
      } else {
        return { url, icon: ExternalLink, label: 'Link' };
      }
    });
    
    return links;
  };

  const getCooldownProgress = () => {
    if (!lastUpdateTime || !cooldownTime) return 0;
    const elapsed = COOLDOWN_PERIOD - cooldownTime;
    return (elapsed / COOLDOWN_PERIOD) * 100;
  };

  return (
    <div className="min-h-screen bg-black">
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showCreateButton={true}
      />

      <div className="lg:pl-24 pt-16 lg:pt-8 pb-16 lg:pb-8 px-4 lg:px-8">
        <div className="w-full max-w-6xl mx-auto">
          {success && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800 rounded-xl shadow-lg animate-fade-in backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-300 font-medium">{success}</p>
                </div>
                <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-800 rounded-xl shadow-lg animate-fade-in backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 font-medium">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-r from-gray-900 to-black flex items-center justify-center mb-4 shadow-2xl border-4 border-gray-900">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                        onError={() => setAvatarLoadError(true)}
                      />
                    ) : avatarLoadError ? (
                      <div className="flex flex-col items-center justify-center">
                        <Sparkles className="w-12 h-12 text-purple-500" />
                        <span className="text-xs text-purple-400 mt-1">No Avatar</span>
                      </div>
                    ) : (
                      <User className="w-16 h-16 text-purple-500" />
                    )}
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full border-4 border-gray-900 flex items-center justify-center shadow-2xl">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold text-white mb-1">
                    {profileData?.name || "No Profile"}
                  </h1>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${hasProfile ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                    <span className="text-sm text-gray-400">
                      {hasProfile ? "Profile Active" : "No Profile Created"}
                    </span>
                  </div>

                  {wallet && (
                    <div className="w-full mb-6">
                      <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3 border border-gray-800">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <p className="text-sm font-mono text-gray-300 truncate">
                            {wallet.substring(0, 8)}...{wallet.substring(wallet.length - 6)}
                          </p>
                        </div>
                        <button
                          onClick={copyWalletAddress}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                          title="Copy wallet address"
                        >
                          {copiedAddress ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="w-full space-y-3">
                    {hasProfile ? (
                      <>
                        <button
                          onClick={enterEditMode}
                          disabled={!!(cooldownTime && cooldownTime > 0)}
                          className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                            cooldownTime && cooldownTime > 0
                              ? 'bg-gray-900 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl'
                          }`}
                        >
                          <Edit2 className="w-5 h-5" />
                          Edit Profile
                        </button>
                        <button 
                          onClick={() => fetchProfileData(wallet!)}
                          className="w-full py-2 text-sm text-gray-400 hover:text-gray-300 bg-gray-900 hover:bg-gray-800 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-gray-800"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh Data
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        disabled={!wallet}
                        className={`w-full py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all ${
                          !wallet ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <User className="w-5 h-5" />
                        Create Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-900 to-black flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Update Cooldown</h3>
                    <p className="text-sm text-gray-400">14-day protection period</p>
                  </div>
                </div>

                {cooldownTime && cooldownTime > 0 ? (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Cooldown Progress</span>
                        <span>{formatTime(cooldownTime)} remaining</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 to-violet-600 transition-all duration-1000"
                          style={{ width: `${getCooldownProgress()}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-300">
                          Next update available in {formatTimeHuman(cooldownTime)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-green-900/30 border border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-300">
                        You can update your profile now
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-300">Tips:</span>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-500">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5"></div>
                      <span>Plan updates carefully during cooldown</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5"></div>
                      <span>Use bio for GitHub, Twitter, LinkedIn links</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5"></div>
                      <span>Skills help others discover your profile</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-900 to-black flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Profile Info</h3>
                    <p className="text-sm text-gray-400">Creation details</p>
                  </div>
                </div>

                {profileData?.createdAt && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Created</span>
                      <span className="text-sm font-medium text-purple-400">
                        {formatTimestamp(profileData.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Skills</span>
                      <span className="text-sm font-medium text-purple-400">
                        {profileData.skills.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {hasProfile && profileData && !editMode && !isLoadingProfile && (
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Professional Profile</h2>
                      <p className="text-gray-400">Your decentralized identity on the blockchain</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-300 rounded-full">
                        v{profileData.version}
                      </span>
                      <span className="text-xs px-2 py-1 bg-violet-900/50 text-violet-300 rounded-full">
                        {profileData.type}
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">About</h3>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 whitespace-pre-line text-gray-300">
                      {profileData.bio}
                    </div>
                    
                    {profileData.bio && extractLinks(profileData.bio).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Links</h4>
                        <div className="flex flex-wrap gap-2">
                          {extractLinks(profileData.bio).map((link, index) => (
                            <a
                              key={index}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 bg-black border border-gray-800 rounded-lg hover:border-purple-600 hover:shadow-lg transition-all"
                            >
                              <link.icon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-300">{link.label}</span>
                              <ExternalLink className="w-3 h-3 text-purple-500" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Skills & Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-purple-300 rounded-lg font-medium text-sm border border-gray-800 shadow-lg"
                        >
                          {skill.charAt(0).toUpperCase() + skill.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(editMode || !hasProfile) && !isLoadingProfile && (
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {hasProfile ? "Edit Profile" : "Create Your Profile"}
                      </h2>
                      <p className="text-gray-400">
                        {hasProfile ? "Update your professional information" : "Build your decentralized identity on the blockchain"}
                      </p>
                    </div>
                    {hasProfile && (
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-gray-300 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors border border-gray-800"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>

                  {cooldownTime && cooldownTime > 0 && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="font-medium text-purple-300">Update Cooldown Active</p>
                          <p className="text-sm text-purple-400">
                            You can update your profile again in {formatTimeHuman(cooldownTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {bioTipsVisible && (
                    <div className="mb-6 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-purple-300 mb-1">Profile Tips</p>
                            <ul className="text-sm text-purple-400 space-y-1">
                              <li>• Include GitHub, Twitter, LinkedIn links in your bio</li>
                              <li>• Add relevant skills to help others find you</li>
                              <li>• Profile updates are subject to 14-day cooldown</li>
                              <li>• Example: "Full-stack developer | GitHub: github.com/yourusername"</li>
                            </ul>
                          </div>
                        </div>
                        <button 
                          onClick={() => setBioTipsVisible(false)}
                          className="text-purple-500 hover:text-purple-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Display Name *
                      </label>
                      <input
                        placeholder="Enter your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={!wallet}
                        className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-gray-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Bio *
                        </label>
                        <span className="text-xs text-gray-500">
                          {bio.length}/500 characters
                        </span>
                      </div>
                      <textarea
                        placeholder={`Tell us about yourself, your skills, and what you're looking for\n\nInclude links to your GitHub, Twitter, LinkedIn, etc.\nExample:\n- Full-stack developer with 5+ years experience\n- GitHub: https://github.com/yourusername\n- Twitter: https://twitter.com/yourhandle`}
                        value={bio}
                        onChange={e => setBio(e.target.value.substring(0, 500))}
                        disabled={!wallet || !!(cooldownTime && cooldownTime > 0)}
                        rows={6}
                        className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-600 resize-none disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-gray-600"
                      />
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <LinkIcon className="w-3 h-3" />
                        <span>Include links for better visibility</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Skills *
                        <span className="text-xs text-gray-500 ml-2">(Add at least one)</span>
                      </label>
                      <div className="flex gap-2 mb-3">
                        <input
                          placeholder="e.g., solidity, react, web3, typescript"
                          value={skillInput}
                          onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addSkill()}
                          disabled={!wallet || !!(cooldownTime && cooldownTime > 0)}
                          className="flex-1 px-4 py-2 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-gray-600"
                        />
                        <button 
                          onClick={addSkill}
                          disabled={!wallet || !!(cooldownTime && cooldownTime > 0)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-medium flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 min-h-12 p-2 bg-gray-900 rounded-lg border border-gray-800">
                        {skills.map((skill, index) => (
                          <div key={index} className="relative group">
                            <span className="px-3 py-1.5 bg-black text-purple-300 rounded-lg font-medium text-sm border border-gray-800 shadow-lg">
                              {skill}
                            </span>
                            <button
                              onClick={() => removeSkill(skill)}
                              disabled={!!(cooldownTime && cooldownTime > 0)}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-30"
                              title="Remove skill"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {skills.length === 0 && (
                          <div className="flex items-center justify-center w-full py-2">
                            <span className="text-sm text-purple-500">No skills added yet</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profile Image
                        <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                      </label>
                      
                      <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-gray-900 to-black flex items-center justify-center border-4 border-gray-900 shadow-2xl overflow-hidden">
                          {avatarPreview ? (
                            <img 
                              src={avatarPreview} 
                              alt="Avatar preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-purple-500" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${!wallet || !!(cooldownTime && cooldownTime > 0) ? 'bg-gray-900 text-gray-500 cursor-not-allowed' : 'bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 hover:text-white'}`}>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">Choose Image</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
                              onChange={handleAvatarChange}
                              disabled={!wallet || !!(cooldownTime && cooldownTime > 0)}
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            PNG, JPG, SVG, GIF, WEBP • Max 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-800">
                      <button 
                        disabled={loading || !wallet || !!(cooldownTime && cooldownTime > 0)} 
                        onClick={handleSubmit}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-2xl hover:shadow-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {loading ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Saving to Blockchain...</span>
                          </>
                        ) : cooldownTime && cooldownTime > 0 ? (
                          <>
                            <Clock className="w-5 h-5" />
                            <span>Update Blocked (14-day Cooldown)</span>
                          </>
                        ) : hasProfile ? (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Update Profile</span>
                          </>
                        ) : (
                          <>
                            <User className="w-5 h-5" />
                            <span>Create Profile</span>
                          </>
                        )}
                      </button>
                      
                      <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500">
                          Your profile will be stored on IPFS and mapped to your wallet address
                        </p>
                        <p className="text-xs text-purple-400 mt-1">
                          {hasProfile ? "14-day cooldown applies after each update" : "First creation has no cooldown"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingProfile && (
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl p-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                    <p className="text-gray-400">Loading your profile data...</p>
                    <p className="text-sm text-purple-400 mt-1">Fetching from blockchain and IPFS</p>
                  </div>
                </div>
              )}

              {!wallet && !isLoadingProfile && (
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl p-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-900 to-black flex items-center justify-center mb-4">
                      <Heart className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-400 mb-6 max-w-md">
                      Connect your Ethereum wallet to create or view your decentralized profile on the blockchain
                    </p>
                    <button
                      onClick={reconnectWallet}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors shadow-2xl"
                    >
                      Connect Wallet
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}