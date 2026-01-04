// src/pages/HomeLand.tsx - Fixed Layout Version
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import { ethers } from "ethers";
import { ProjectRegistryABI, PROJECT_CONTRACT_ADDRESS, ProjectStatus } from "../contracts/ProjectRegistryABI";
import { useWeb3 } from "../hooks/web3";
import { Toaster, toast } from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  MessageSquare, 
  FolderOpen,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Hash,
  User,
  Calendar,
  Tag,
  Eye,
  ArrowRight,
  Copy,
  Send,
  Lock,
  ChevronDown} from 'lucide-react';

import { ThreeDot } from 'react-loading-indicators';

interface ProjectMetadata {
  type: string;
  version: string;
  title: string;
  description: string;
  tags: string[];
  images: Array<{
    cid: string;
    type: string;
  }>;
  createdAt: number;
}

interface ProjectData {
  id: number;
  cid: string;
  creator: string;
  status: number;
  metadata: ProjectMetadata | null;
  hasMetadata: boolean;
  coverImageUrl?: string;
  formattedDate?: string;
}

interface ContractProject {
  builder: string;
  metadataCID: string;
  status: bigint;
}

const IPFS_GATEWAYS = [
  'https://w3s.link/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
];

const PUBLIC_RPC_ENDPOINTS = [
  'https://ethereum-sepolia.publicnode.com',
  'https://eth-sepolia.g.alchemy.com/v2/demo',
  'https://rpc.sepolia.org',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
];

const metadataCache = new Map<string, unknown>();
const imageCache = new Map<string, string>();

const INITIAL_LOAD_COUNT = 8;
const LOAD_MORE_COUNT = 4;
const LAZY_LOAD_THRESHOLD = 300;

const getPublicProvider = async (): Promise<ethers.JsonRpcProvider> => {
  for (const endpoint of PUBLIC_RPC_ENDPOINTS) {
    try {
      const provider = new ethers.JsonRpcProvider(endpoint);
      await provider.getNetwork();
      return provider;
    } catch (error) {
      console.warn(`Failed to connect to ${endpoint}, trying next...`);
      continue;
    }
  }
  throw new Error("All public RPC endpoints failed");
};

const HomeLand = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [visibleProjects, setVisibleProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [filter, setFilter] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [showConnectWalletModal, setShowConnectWalletModal] = useState(false);
  const [selectedProjectForChat, setSelectedProjectForChat] = useState<{id: number, title: string, creator: string} | null>(null);
  const [showChatGuide, setShowChatGuide] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  
  const loadingRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<IntersectionObserver>();
  const lastProjectRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const { account } = useWeb3?.() || {};

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  useEffect(() => {
    let result = [...projects];
    
    if (filter !== null) {
      result = result.filter(project => project.status === filter);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      setSearching(true);
      
      result = result.filter(project => {
        if (project.id.toString().includes(term)) return true;
        if (project.metadata?.title?.toLowerCase().includes(term)) return true;
        if (project.metadata?.tags?.some(tag => 
          tag.toLowerCase().includes(term)
        )) return true;
        if (project.creator.toLowerCase().includes(term)) return true;
        return false;
      });
    } else {
      setSearching(false);
    }
    
    setVisibleProjects(result.slice(0, INITIAL_LOAD_COUNT));
    setHasMore(result.length > INITIAL_LOAD_COUNT);
  }, [projects, filter, searchTerm]);

  const getContract = useCallback(async (): Promise<ethers.Contract | null> => {
    try {
      let provider;
      
      if (typeof window.ethereum !== 'undefined' && account) {
        try {
          provider = new ethers.BrowserProvider(window.ethereum);
          await provider.getNetwork();
        } catch (walletError) {
          console.warn("Wallet provider failed, falling back to public RPC", walletError);
          provider = await getPublicProvider();
        }
      } else {
        provider = await getPublicProvider();
      }
      
      return new ethers.Contract(
        PROJECT_CONTRACT_ADDRESS,
        ProjectRegistryABI,
        provider
      );
    } catch (error) {
      console.error("Error initializing contract:", error);
      setNetworkError("Unable to connect to blockchain network. Please check your connection.");
      return null;
    }
  }, [account]);

  const cleanCid = (cid: string): string => {
    if (!cid) return '';
    return cid.replace('ipfs://', '').replace('/ipfs/', '').trim();
  };

  const fetchMetadata = async (cid: string): Promise<{ 
    metadata: ProjectMetadata | null; 
    hasMetadata: boolean;
    coverImageUrl?: string;
    formattedDate?: string;
  }> => {
    try {
      const cleanCidStr = cleanCid(cid);
      if (!cleanCidStr) return { metadata: null, hasMetadata: false };
      
      if (metadataCache.has(cleanCidStr)) {
        const cached = metadataCache.get(cleanCidStr);
        let coverImageUrl = undefined;
        const coverImage = cached.images?.find(img => img.type === 'cover');
        if (coverImage && imageCache.has(cleanCid(coverImage.cid))) {
          coverImageUrl = imageCache.get(cleanCid(coverImage.cid));
        }
        
        return {
          metadata: cached,
          hasMetadata: true,
          coverImageUrl,
          formattedDate: formatDate(cached.createdAt)
        };
      }
      
      for (const gateway of IPFS_GATEWAYS.slice(0, 3)) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const url = `${gateway}${cleanCidStr}`;
          const response = await fetch(url, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const metadata = await response.json();
            metadataCache.set(cleanCidStr, metadata);
            
            let coverImageUrl = undefined;
            const coverImage = metadata.images?.find(img => img.type === 'cover');
            if (coverImage) {
              coverImageUrl = `${IPFS_GATEWAYS[0]}${cleanCid(coverImage.cid)}`;
              imageCache.set(cleanCid(coverImage.cid), coverImageUrl);
            }
            
            return {
              metadata,
              hasMetadata: true,
              coverImageUrl,
              formattedDate: formatDate(metadata.createdAt)
            };
          }
        } catch (error) {
          continue;
        }
      }
      
      return { metadata: null, hasMetadata: false };
    } catch (error) {
      console.log(`Failed to fetch metadata for CID ${cid}:`, error);
      return { metadata: null, hasMetadata: false };
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getContractStatus = (statusBigInt: bigint): number => {
    try {
      const statusNumber = Number(statusBigInt);
      switch (statusNumber) {
        case 0: return ProjectStatus.Draft;
        case 1: return ProjectStatus.Funding;
        case 2: return ProjectStatus.Completed;
        case 3: return ProjectStatus.Failed;
        default: return ProjectStatus.Draft;
      }
    } catch (error) {
      console.error("Error converting status:", error);
      return ProjectStatus.Draft;
    }
  };

  const getStatusInfo = (status: number) => {
    switch (status) {
      case ProjectStatus.Draft:
        return { 
          text: "Draft", 
          color: "bg-purple-900/40 text-purple-300 border-purple-700",
          icon: <FileText className="w-4 h-4" />,
          bgColor: "bg-purple-900/30"
        };
      case ProjectStatus.Funding:
        return { 
          text: "Funding", 
          color: "bg-purple-900/40 text-purple-300 border-purple-700",
          icon: <TrendingUp className="w-4 h-4" />,
          bgColor: "bg-purple-900/30"
        };
      case ProjectStatus.Completed:
        return { 
          text: "Completed", 
          color: "bg-purple-900/40 text-purple-300 border-purple-700",
          icon: <CheckCircle className="w-4 h-4" />,
          bgColor: "bg-purple-900/30"
        };
      case ProjectStatus.Failed:
        return { 
          text: "Failed", 
          color: "bg-red-900/40 text-red-300 border-red-700",
          icon: <XCircle className="w-4 h-4" />,
          bgColor: "bg-red-900/30"
        };
      default:
        return { 
          text: "Unknown", 
          color: "bg-gray-900/40 text-gray-400 border-gray-700",
          icon: <AlertCircle className="w-4 h-4" />,
          bgColor: "bg-gray-900/30"
        };
    }
  };

  const formatAddress = (address: string): string => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const fetchTotalProjects = useCallback(async (contract: ethers.Contract): Promise<number> => {
    try {
      const count = await contract.nextProjectId();
      const total = Number(count);
      setTotalProjects(total);
      setNetworkError(null);
      return total;
    } catch (error) {
      console.error("Error fetching project count:", error);
      setNetworkError("Failed to fetch projects from blockchain. Please try again.");
      return 0;
    }
  }, []);

  const fetchProjects = useCallback(async (pageNum: number, statusFilter: number | null = null, isRefresh: boolean = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      if (pageNum > 0) setLoadingMore(true);
      else setLoading(true);
      if (isRefresh) setIsRefreshing(true);
      setNetworkError(null);

      const contract = await getContract();
      if (!contract) {
        setNetworkError("Unable to connect to the smart contract.");
        return;
      }

      const total = await fetchTotalProjects(contract);
      const startIndex = pageNum === 0 ? 0 : projects.length;
      const itemsToLoad = pageNum === 0 ? INITIAL_LOAD_COUNT : LOAD_MORE_COUNT;
      
      if (startIndex >= total) {
        setHasMore(false);
        return;
      }

      const endIndex = Math.min(startIndex + itemsToLoad, total);
      const batchPromises: Promise<ProjectData | null>[] = [];

      for (let i = startIndex; i < endIndex; i++) {
        batchPromises.push(
          (async () => {
            try {
              const project: ContractProject = await contract.getProject(i);
              
              const contractStatus = getContractStatus(project.status);
              
              if (statusFilter !== null && contractStatus !== statusFilter) {
                return null;
              }

              const { metadata, hasMetadata, coverImageUrl, formattedDate } = await fetchMetadata(project.metadataCID);
              
              return {
                id: i,
                cid: project.metadataCID,
                creator: project.builder,
                status: contractStatus,
                metadata,
                hasMetadata,
                coverImageUrl,
                formattedDate
              };
            } catch (error) {
              console.error(`Error fetching project ${i}:`, error);
              return {
                id: i,
                cid: "N/A",
                creator: "0x0000000000000000000000000000000000000000",
                status: ProjectStatus.Draft,
                metadata: null,
                hasMetadata: false
              };
            }
          })()
        );
      }

      const newProjects = await Promise.all(batchPromises);
      const validProjects = newProjects.filter(p => p !== null) as ProjectData[];

      setProjects(prev => {
        if (pageNum === 0 || isRefresh) {
          return validProjects;
        }
        
        const merged = [...prev, ...validProjects];
        return merged;
      });

      setHasMore(endIndex < total);
      setPage(pageNum + 1);
      
    } catch (error) {
      console.error("Error fetching projects:", error);
      setNetworkError("Failed to load projects. Please check your connection and try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [getContract, fetchTotalProjects, projects.length]);

  useEffect(() => {
    fetchProjects(0, filter);
  }, [filter, fetchProjects]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          fetchProjects(page, filter);
        }
      },
      { threshold: 0.1, rootMargin: `${LAZY_LOAD_THRESHOLD}px` }
    );

    if (lastProjectRef.current) {
      observerRef.current.observe(lastProjectRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadingMore, page, filter, fetchProjects]);

  const handleSmoothScroll = useCallback((targetId: string) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    setIsScrolling(true);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      element.classList.add('ring-2', 'ring-purple-500', 'ring-offset-0', 'transition-all', 'duration-1000');
      
      scrollTimeoutRef.current = setTimeout(() => {
        element.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-0');
        setIsScrolling(false);
      }, 2000);
    }
  }, []);

  const handleFilterChange = (newFilter: number | null) => {
    setFilter(newFilter);
    setProjects([]);
    setVisibleProjects([]);
    setPage(0);
    setHasMore(true);
    setFilterOpen(false);
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearch = (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  };

  const handleTalkToOwner = (projectId: number, projectTitle: string, creatorAddress: string) => {
    if (!account) {
      setShowConnectWalletModal(true);
      return;
    }
    
    setSelectedProjectForChat({
      id: projectId,
      title: projectTitle,
      creator: creatorAddress
    });
    setShowChatGuide(true);
  };

  const handleViewDetails = (projectId: number) => {
    navigate(`/project/${projectId}`);
  };

  const handleCreateProject = () => {
    if (!account) {
      setShowConnectWalletModal(true);
      return;
    }
    navigate('/create-project');
  };

  const handleConnectWallet = () => {
    navigate('/login');
    setShowConnectWalletModal(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const goToMessagesWithInvite = () => {
    if (selectedProjectForChat) {
      localStorage.setItem('pending_invite_address', selectedProjectForChat.creator);
      localStorage.setItem('pending_invite_project', JSON.stringify({
        id: selectedProjectForChat.id,
        title: selectedProjectForChat.title
      }));
      
      navigate('/messages');
      setShowChatGuide(false);
    }
  };

  const getGatewayUrl = (cid: string): string => {
    const cleanCidStr = cleanCid(cid);
    return `${IPFS_GATEWAYS[0]}${cleanCidStr}`;
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleSearchById = () => {
    if (!searchTerm.trim()) return;
    
    const id = parseInt(searchTerm);
    if (!isNaN(id) && id >= 0) {
      const project = projects.find(p => p.id === id);
      if (project) {
        handleSmoothScroll(`project-${id}`);
      } else {
        toast.error(`Project #${id} not loaded yet. Try refreshing or load more projects.`);
      }
    }
  };

  const handleLoadMore = () => {
    if (!loadingRef.current && hasMore) {
      fetchProjects(page, filter);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    img.style.opacity = '1';
    img.classList.add('loaded');
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 overflow-x-hidden">
      <Toaster position="top-right" toastOptions={{
        className: '!bg-gray-900 !border !border-gray-800 !text-gray-100',
      }} />
      
      <Sidebar />
      
      {showConnectWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowConnectWalletModal(false)}
          />
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-purple-500/10 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-100">Connect Wallet</h3>
              <button
                onClick={() => setShowConnectWalletModal(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-gray-400 mb-6">
              Connect your wallet to interact with projects, create new projects, and access all features.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleConnectWallet}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <User className="w-5 h-5" />
                Go to Login Page
              </button>
              <button
                onClick={() => setShowConnectWalletModal(false)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-700 transition-all duration-300"
              >
                Continue Without Wallet
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                Don't have a wallet? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">Get MetaMask</a>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {showChatGuide && selectedProjectForChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowChatGuide(false);
              setSelectedProjectForChat(null);
            }}
          />
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-purple-500/10 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  Connect with Project Owner
                </h3>
                <p className="text-sm text-gray-400 mt-1">Project: {selectedProjectForChat.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowChatGuide(false);
                  setSelectedProjectForChat(null);
                }}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h4 className="font-bold text-gray-100 mb-3">How to start a conversation:</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-900/50 text-purple-300 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                    <div>
                      <p className="font-medium text-gray-100">Go to Messages</p>
                      <p className="text-sm text-gray-400">Open the chat interface to create private rooms</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-800/50 text-purple-300 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                    <div>
                      <p className="font-medium text-gray-100">Create Private Room</p>
                      <p className="text-sm text-gray-400">Select "Private" room type for secure conversations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-700/50 text-purple-300 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                    <div>
                      <p className="font-medium text-gray-100">Invite the Builder</p>
                      <p className="text-sm text-gray-400">Use the wallet address below to send invitation</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    Builder's Wallet Address:
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedProjectForChat.creator)}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 font-mono text-sm break-all border border-gray-700">
                  {selectedProjectForChat.creator}
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h4 className="font-bold text-gray-100 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                  Quick Action
                </h4>
                <p className="text-sm text-gray-400 mb-3">
                  We'll pre-fill the builder's address when you go to Messages.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={goToMessagesWithInvite}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg font-medium shadow-purple-500/20 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Go to Messages
                  </button>
                  <button
                    onClick={() => copyToClipboard(selectedProjectForChat.creator)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Address
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Need help? Check our chat guide
                </p>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    toast.success('Opening chat tutorial...');
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  View Tutorial
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="relative z-10 w-full pt-16 pb-20 lg:pt-0 lg:pb-0 lg:ml-20">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {networkError && (
            <div className="mt-4 mb-4 bg-gray-900 border border-red-800 rounded-2xl p-4 shadow-lg shadow-red-500/10 animate-in slide-in-from-top duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-100 mb-1">Connection Issue</h4>
                  <p className="text-gray-300 text-sm mb-2">{networkError}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchProjects(0, filter, true)}
                      className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                    {!account && (
                      <button
                        onClick={handleConnectWallet}
                        className="px-3 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <User className="w-3 h-3" />
                        Connect Wallet
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!account && !networkError && (
            <div className="mt-4 mb-4 bg-gray-900 border border-purple-800 rounded-2xl p-4 shadow-lg shadow-purple-500/10 animate-in slide-in-from-top duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100 mb-1">Connect your wallet</h4>
                    <p className="text-gray-400 text-sm">
                      Connect your wallet to create projects, interact with creators, and unlock all features.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleConnectWallet}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 whitespace-nowrap flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Connect Wallet
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 mb-6 sm:mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl shadow-purple-500/10">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg shadow-purple-500/10 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-100 mb-2 flex items-center gap-3">
                      <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                      Discover Projects
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base">
                      {account ? (
                        <>
                          Explore {totalProjects} innovative projects from the community
                        </>
                      ) : (
                        <>
                          Browse {totalProjects} public projects. <button 
                            onClick={handleConnectWallet} 
                            className="text-purple-400 hover:text-purple-300 underline"
                          >
                            Connect wallet
                          </button> to interact.
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <button
                      onClick={() => fetchProjects(0, filter, true)}
                      disabled={isRefreshing}
                      className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-700 hover:shadow-lg shadow-purple-500/10 transition-all duration-300 disabled:opacity-50 flex items-center gap-2 text-sm font-medium w-full sm:w-auto justify-center"
                    >
                      {isRefreshing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Refreshing...</span>
                          <span className="sm:hidden">Refresh</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Refresh</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                <div className="lg:col-span-2 w-full">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search projects by ID, title, tags, or creator address..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm shadow-purple-500/10 placeholder-gray-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    {searchTerm && !isNaN(parseInt(searchTerm)) && (
                      <button
                        onClick={handleSearchById}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300"
                        title="Find project by ID"
                      >
                        <Hash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {searching && (
                    <p className="text-xs text-purple-400 mt-2">
                      Found {projects.filter(p => {
                        if (!p.metadata?.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                            !p.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) &&
                            !p.creator.toLowerCase().includes(searchTerm.toLowerCase()) &&
                            !p.id.toString().includes(searchTerm)) {
                          return false;
                        }
                        return true;
                      }).length} project{projects.length !== 1 ? 's' : ''} matching "{searchTerm}"
                    </p>
                  )}
                </div>

                <div className="relative w-full">
                  <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-700 hover:shadow-lg shadow-purple-500/10 transition-all duration-300 px-4 py-3 flex items-center gap-2 text-sm font-medium justify-center"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filter by Status</span>
                    {filter !== null && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-900/30 text-purple-300 text-xs rounded-full">
                        {getStatusInfo(filter).text}
                      </span>
                    )}
                  </button>
                  
                  {filterOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-xl shadow-purple-500/20 z-50 overflow-hidden animate-in fade-in duration-200">
                      <button
                        onClick={() => handleFilterChange(null)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors flex items-center justify-between ${filter === null ? 'bg-gray-800 text-purple-300' : 'text-gray-300'}`}
                      >
                        <span>All Projects</span>
                        <span className="text-sm text-gray-500">({totalProjects})</span>
                      </button>
                      
                      {Object.entries(ProjectStatus).map(([key, value]) => {
                        const statusInfo = getStatusInfo(value);
                        return (
                          <button
                            key={key}
                            onClick={() => handleFilterChange(value)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors flex items-center gap-2 ${filter === value ? 'bg-gray-800 text-purple-300' : 'text-gray-300'}`}
                          >
                            <div className={`p-1.5 rounded ${statusInfo.bgColor}`}>
                              {statusInfo.icon}
                            </div>
                            <span>{key}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
            <div className="lg:w-2/3 w-full" ref={scrollContainerRef}>
              <div className="space-y-4 sm:space-y-6 w-full" style={{ scrollBehavior: 'smooth' }}>
                {visibleProjects.map((project, index) => {
                  const statusInfo = getStatusInfo(project.status);
                  const gatewayUrl = getGatewayUrl(project.cid);
                  const isLastProject = index === visibleProjects.length - 1;
                  
                  return (
                    <div 
                      key={project.id} 
                      id={`project-${project.id}`}
                      ref={isLastProject && hasMore ? lastProjectRef : null}
                      className="group bg-gray-900 border border-gray-800 rounded-2xl shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-500 overflow-hidden animate-in fade-in slide-in-from-bottom-4 hover:border-gray-700 w-full"
                      style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-2 border ${statusInfo.color}`}>
                              {statusInfo.icon}
                              <span className="hidden xs:inline">{statusInfo.text}</span>
                              <span className="xs:hidden">{statusInfo.text.substring(0, 3)}</span>
                            </div>
                            <div className="px-3 py-1.5 bg-gray-800 text-purple-300 text-xs sm:text-sm font-medium rounded-full flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              #{project.id}
                            </div>
                          </div>
                          
                          {project.hasMetadata && (
                            <a 
                              href={gatewayUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors mt-2 sm:mt-0 flex items-center gap-1"
                              title="View JSON metadata"
                            >
                              <FileText className="w-3 h-3" />
                              View Metadata
                            </a>
                          )}
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 w-full">
                          <div className="md:w-2/5 w-full">
                            <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden group/image w-full">
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/50 transition-opacity duration-300"></div>
                              {project.coverImageUrl ? (
                                <img 
                                  src={project.coverImageUrl}
                                  alt={project.metadata?.title || `Project #${project.id}`}
                                  className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-700 opacity-0"
                                  loading="lazy"
                                  onLoad={handleImageLoad}
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.style.opacity = '1';
                                    img.style.background = 'linear-gradient(to bottom right, #111827, #000)';
                                  }}
                                  style={{
                                    opacity: 0,
                                    transition: 'opacity 0.5s ease-in-out'
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                                  <div className="w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-3 opacity-70 bg-gray-800 rounded-xl flex items-center justify-center">
                                    <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                                  </div>
                                  <span className="text-xs sm:text-sm text-gray-500">No cover image</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="md:w-3/5 w-full">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2 sm:mb-3 group-hover:text-purple-300 transition-colors line-clamp-2">
                              {project.metadata?.title || `Project #${project.id}`}
                            </h3>
                            
                            <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                              {project.metadata?.description || "No description available"}
                            </p>
                            
                            {project.metadata?.tags && project.metadata.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
                                {project.metadata.tags.slice(0, windowWidth < 640 ? 3 : 5).map((tag, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 sm:px-3 py-1 bg-gray-800 text-purple-300 text-xs sm:text-sm rounded-lg border border-gray-700 flex items-center gap-1"
                                  >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                  </span>
                                ))}
                                {project.metadata.tags.length > (windowWidth < 640 ? 3 : 5) && (
                                  <span className="px-2 sm:px-3 py-1 bg-gray-800 text-gray-400 text-xs sm:text-sm rounded-lg flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    +{project.metadata.tags.length - (windowWidth < 640 ? 3 : 5)}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-gray-400 mb-4 sm:mb-6 w-full">
                              <div className="space-y-1 w-full">
                                <div className="font-medium text-gray-300 text-xs sm:text-sm flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  Type
                                </div>
                                <div className="font-medium text-purple-300 text-sm sm:text-base">
                                  {project.metadata?.type || "Unknown"}
                                </div>
                              </div>
                              <div className="space-y-1 w-full">
                                <div className="font-medium text-gray-300 text-xs sm:text-sm flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  Version
                                </div>
                                <div className="font-mono text-sm sm:text-base text-gray-300">
                                  {project.metadata?.version || "N/A"}
                                </div>
                              </div>
                              {project.formattedDate && (
                                <div className="space-y-1 sm:col-span-2 w-full">
                                  <div className="font-medium text-gray-300 text-xs sm:text-sm flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Created
                                  </div>
                                  <div className="text-sm sm:text-base text-gray-300">{project.formattedDate}</div>
                                </div>
                              )}
                            </div>
                            
                            <div className="pt-4 sm:pt-5 border-t border-gray-800 w-full">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium text-white shadow-md shadow-purple-500/30">
                                      {project.creator.slice(2, 4).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-xs sm:text-sm font-medium text-gray-300 flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {formatAddress(project.creator)}
                                      </div>
                                      <div className="text-xs text-purple-400">
                                        Creator
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
                                  <button
                                    onClick={() => handleTalkToOwner(
                                      project.id,
                                      project.metadata?.title || `Project #${project.id}`,
                                      project.creator
                                    )}
                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium min-w-[120px] ${
                                      account 
                                        ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30"
                                        : "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                                    }`}
                                    title={!account ? "Connect wallet to talk to owner" : ""}
                                  >
                                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden xs:inline">Contact</span>
                                    <span className="xs:hidden">Contact</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleViewDetails(project.id)}
                                    className="px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-700 hover:border-purple-500 text-purple-400 hover:text-purple-300 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2"
                                  >
                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Details</span>
                                    <span className="sm:hidden">View</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {loading && visibleProjects.length === 0 && (
                <div className="text-center py-12 w-full">
                  <div className="flex flex-col items-center justify-center">
                    <ThreeDot 
                      variant="bounce" 
                      color="#8B5CF6" // Purple-500 color
                      size="medium" 
                      text="" 
                      textColor="" 
                    />
                    <p className="mt-4 text-gray-400 text-sm sm:text-base">Loading projects...</p>
                    <p className="text-xs sm:text-sm text-purple-400 mt-2">
                      {account ? "Fetching from blockchain..." : "Loading public projects..."}
                    </p>
                  </div>
                </div>
              )}

              {loadingMore && (
                <div className="text-center py-8 w-full">
                  <div className="flex flex-col items-center justify-center">
                    <ThreeDot 
                      variant="bounce" 
                      color="#8B5CF6" // Purple-500 color
                      size="small" 
                      text="" 
                      textColor="" 
                    />
                    <p className="mt-3 text-gray-400 text-sm">Loading more projects...</p>
                  </div>
                </div>
              )}

              {hasMore && !loading && !loadingMore && visibleProjects.length > 0 && (
                <div className="text-center py-8 w-full">
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 transition-all duration-300 flex items-center gap-2 mx-auto"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Load More Projects
                  </button>
                </div>
              )}

              {!hasMore && visibleProjects.length > 0 && (
                <div className="text-center py-8 w-full">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-900/30 mb-3 sm:mb-4">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                  </div>
                  <p className="text-gray-400 text-sm sm:text-base">
                    {account 
                      ? `You've reached the end. Showing ${visibleProjects.length} of ${projects.length} projects`
                      : `Showing ${visibleProjects.length} public projects. Connect wallet for more features.`
                    }
                  </p>
                </div>
              )}

              {!loading && visibleProjects.length === 0 && (
                <div className="text-center py-12 sm:py-16 bg-gray-900 border border-gray-800 rounded-2xl shadow-lg shadow-purple-500/10 w-full">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6">
                    <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center">
                      <FolderOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2 sm:mb-3">
                    No projects found
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto px-4">
                    {searchTerm 
                      ? `No projects match your search "${searchTerm}". Try different keywords.`
                      : filter !== null 
                        ? `No projects match the current filter. Try changing your filter settings.`
                        : "Be the first to create an amazing project!"}
                  </p>
                  <button
                    onClick={handleCreateProject}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium shadow-lg transition-all duration-300 text-sm sm:text-base ${
                      account
                        ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white hover:shadow-xl hover:shadow-purple-500/30"
                        : "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:shadow-xl"
                    }`}
                    title={!account ? "Connect wallet to create project" : ""}
                  >
                    {account ? "Create New Project" : "Connect Wallet to Create"}
                  </button>
                </div>
              )}
            </div>

            <div className="lg:w-1/3 hidden lg:block">
              <div className="sticky top-24 space-y-6 w-full">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg shadow-purple-500/10 w-full">
                  <h3 className="text-lg font-bold text-gray-100 mb-4">Account Status</h3>
                  <div className="space-y-4 w-full">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700 w-full">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${account ? 'bg-gradient-to-r from-purple-600 to-purple-500' : 'bg-gradient-to-r from-gray-700 to-gray-600'}`}>
                        {account ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <Lock className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-100">
                          {account ? "Wallet Connected" : "No Wallet Connected"}
                        </div>
                        <div className="text-sm text-purple-400">
                          {account ? formatAddress(account) : "Connect wallet to interact"}
                        </div>
                      </div>
                    </div>
                    
                    {account ? (
                      <div className="text-center w-full">
                        <p className="text-sm text-gray-400 mb-3">
                          You're connected and ready to interact with projects.
                        </p>
                        <button
                          onClick={() => navigate('/profile')}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 text-sm font-medium"
                        >
                          View Profile
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleConnectWallet}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 text-sm font-medium"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg shadow-purple-500/10 w-full">
                  <h3 className="text-lg font-bold text-gray-100 mb-4">Platform Overview</h3>
                  <div className="space-y-4 w-full">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800 w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Total Projects</div>
                          <div className="text-2xl font-bold text-gray-100">{totalProjects}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-800/50 w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                          <div className="text-xs font-medium text-purple-300">Active</div>
                        </div>
                        <div className="text-xl font-bold text-purple-400">
                          {projects.filter(p => p.status === ProjectStatus.Funding).length}
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-800/50 w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-purple-400" />
                          <div className="text-xs font-medium text-purple-300">Completed</div>
                        </div>
                        <div className="text-xl font-bold text-purple-400">
                          {projects.filter(p => p.status === ProjectStatus.Completed).length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg shadow-purple-500/10 w-full">
                  <h3 className="text-lg font-bold text-gray-100 mb-4">Project Status</h3>
                  <div className="space-y-3 w-full">
                    {Object.values(ProjectStatus).map(status => {
                      const statusInfo = getStatusInfo(status);
                      const count = projects.filter(p => p.status === status).length;
                      
                      return (
                        <div key={status} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors w-full">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${statusInfo.bgColor}`}>
                              {statusInfo.icon}
                            </div>
                            <span className="font-medium text-gray-300">{statusInfo.text}</span>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            {count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="relative overflow-hidden bg-purple-900/10 border border-purple-800/30 rounded-2xl p-6 shadow-lg shadow-purple-500/10 w-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/10 rounded-full translate-y-12 -translate-x-12"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <FolderOpen className="w-6 h-6 text-purple-400" />
                      <h3 className="text-lg font-bold text-gray-100">Ready to Start?</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                      Share your vision with the community and build something amazing together.
                    </p>
                    <button
                      onClick={handleCreateProject}
                      className={`w-full px-4 py-3 rounded-xl font-medium shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                        account
                          ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white hover:shadow-xl hover:shadow-purple-500/30"
                          : "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:shadow-xl"
                      }`}
                      title={!account ? "Connect wallet to create project" : ""}
                    >
                      <FolderOpen className="w-5 h-5" />
                      {account ? "Create New Project" : "Connect to Create"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {windowWidth < 1024 && visibleProjects.length > 0 && (
        <div className="lg:hidden fixed bottom-20 left-0 right-0 z-20 px-4 w-full">
          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-2xl p-3 shadow-lg shadow-purple-500/10 animate-in slide-in-from-bottom duration-300 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="text-center flex-1">
                <div className="text-xs text-purple-400">Total</div>
                <div className="text-sm font-bold text-gray-100">{totalProjects}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs text-purple-400">Active</div>
                <div className="text-sm font-bold text-purple-400">
                  {projects.filter(p => p.status === ProjectStatus.Funding).length}
                </div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs text-purple-400">With Images</div>
                <div className="text-sm font-bold text-purple-400">
                  {projects.filter(p => p.coverImageUrl).length}
                </div>
              </div>
              {!account && (
                <div className="text-center flex-1">
                  <button
                    onClick={handleConnectWallet}
                    className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-medium rounded-lg shadow shadow-purple-500/20 flex items-center gap-1 mx-auto"
                  >
                    <User className="w-3 h-3" />
                    Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeLand;