// src/pages/HomeLand.tsx - macOS Redesign
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
  ChevronDown,
  Sparkles,
  Globe,
  Code2,
  Server,
  Zap,
  Users,
  BarChart3,
  Plus,
  LayoutDashboard,
  Smartphone,
  PenTool,
  Layers,
  ExternalLink
} from 'lucide-react';

import { ThreeDot } from 'react-loading-indicators';
import { motion, AnimatePresence } from 'framer-motion';
import FlipWord from "../component/FlipWorld"; // Your FlipWord component

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
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  
  const loadingRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<IntersectionObserver>();
  const lastProjectRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const gridRef = useRef<HTMLDivElement>(null);

  const { account } = useWeb3?.() || {};

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
        const cached = metadataCache.get(cleanCidStr) as ProjectMetadata;
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
            const metadata = await response.json() as ProjectMetadata;
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
          bgColor: "bg-purple-900/30",
          gradient: "from-purple-500 to-purple-600"
        };
      case ProjectStatus.Funding:
        return { 
          text: "Funding", 
          color: "bg-cyan-900/40 text-cyan-300 border-cyan-700",
          icon: <TrendingUp className="w-4 h-4" />,
          bgColor: "bg-cyan-900/30",
          gradient: "from-cyan-500 to-blue-500"
        };
      case ProjectStatus.Completed:
        return { 
          text: "Completed", 
          color: "bg-green-900/40 text-green-300 border-green-700",
          icon: <CheckCircle className="w-4 h-4" />,
          bgColor: "bg-green-900/30",
          gradient: "from-green-500 to-emerald-500"
        };
      case ProjectStatus.Failed:
        return { 
          text: "Failed", 
          color: "bg-red-900/40 text-red-300 border-red-700",
          icon: <XCircle className="w-4 h-4" />,
          bgColor: "bg-red-900/30",
          gradient: "from-red-500 to-rose-500"
        };
      default:
        return { 
          text: "Unknown", 
          color: "bg-gray-900/40 text-gray-400 border-gray-700",
          icon: <AlertCircle className="w-4 h-4" />,
          bgColor: "bg-gray-900/30",
          gradient: "from-gray-500 to-gray-600"
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

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    img.style.opacity = '1';
    img.classList.add('loaded');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const cardVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-gray-100 overflow-x-hidden">
      <Toaster position="top-right" toastOptions={{
        className: '!bg-gray-900/95 !border !border-gray-800 !text-gray-100 backdrop-blur-sm',
      }} />
      
      {/* macOS Dock */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <Sidebar activeTab="home" />
      </div>
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-3/4 w-64 h-64 bg-purple-400/3 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <main className="relative z-10 w-full pt-32 pb-20 lg:pt-0 lg:pb-0">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* macOS-style Header with FlipWord */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="bg-gray-900/40 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl shadow-purple-500/10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-700/50 mb-6">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-300">Explore Decentralized Projects</span>
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                    <span className="block text-gray-400 mb-4">Where developers</span>
                    <span className="block bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      <FlipWord 
                        englishText="build the future" 
                        japaneseText="未来を構築する"
                      />
                    </span>
                    <span className="block text-gray-400 mt-4">on the blockchain</span>
                  </h1>
                  
                  <p className="text-xl text-gray-300 mb-8 max-w-3xl">
                    Discover {totalProjects} innovative projects, connect with creators, and join the decentralized revolution.
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleCreateProject}
                      className={`px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all duration-300 flex items-center gap-3 ${
                        account
                          ? "bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white hover:shadow-xl hover:shadow-purple-500/30"
                          : "bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                      }`}
                      title={!account ? "Connect wallet to create project" : ""}
                    >
                      <Plus className="w-5 h-5" />
                      {account ? "Create Project" : "Connect to Create"}
                    </button>
                    
                    <button
                      onClick={() => fetchProjects(0, filter, true)}
                      disabled={isRefreshing}
                      className="px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 rounded-2xl hover:bg-gray-800 hover:border-gray-600 hover:shadow-lg transition-all duration-300 flex items-center gap-3"
                    >
                      <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                </div>
                
                {/* macOS-style Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: totalProjects, label: "Projects", icon: FolderOpen, gradient: "from-purple-500 to-purple-600" },
                    { value: projects.filter(p => p.status === ProjectStatus.Funding).length, label: "Active", icon: TrendingUp, gradient: "from-cyan-500 to-blue-500" },
                    { value: projects.filter(p => p.status === ProjectStatus.Completed).length, label: "Completed", icon: CheckCircle, gradient: "from-green-500 to-emerald-500" },
                    { value: projects.filter(p => p.coverImageUrl).length, label: "With Images", icon: Eye, gradient: "from-rose-500 to-pink-500" }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                      className={`bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-gray-100">{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* macOS-style Control Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-gray-900/40 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl shadow-purple-500/10 mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Search Bar */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search projects by ID, title, tags, or creator address..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-100 rounded-2xl pl-12 pr-10 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent placeholder-gray-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 rounded-2xl hover:bg-gray-800 hover:border-gray-600 transition-all duration-300 px-6 py-4 flex items-center gap-3 justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5" />
                    <span className="font-medium">Filter by Status</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {filterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-2xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-purple-500/20 z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => handleFilterChange(null)}
                        className={`w-full text-left px-6 py-4 hover:bg-gray-800/50 transition-colors flex items-center justify-between ${filter === null ? 'bg-gray-800/50 text-purple-300' : 'text-gray-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5" />
                          <span>All Projects</span>
                        </div>
                        <span className="text-sm text-gray-500">({totalProjects})</span>
                      </button>
                      
                      {Object.entries(ProjectStatus).map(([key, value]) => {
                        const statusInfo = getStatusInfo(value);
                        const count = projects.filter(p => p.status === value).length;
                        return (
                          <button
                            key={key}
                            onClick={() => handleFilterChange(value)}
                            className={`w-full text-left px-6 py-4 hover:bg-gray-800/50 transition-colors flex items-center justify-between ${filter === value ? 'bg-gray-800/50 text-purple-300' : 'text-gray-300'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${statusInfo.bgColor}`}>
                                {statusInfo.icon}
                              </div>
                              <span>{key}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm ${statusInfo.color}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* macOS-style Project Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <motion.div 
                ref={gridRef}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {visibleProjects.map((project, index) => {
                  const statusInfo = getStatusInfo(project.status);
                  const gatewayUrl = getGatewayUrl(project.cid);
                  const isLastProject = index === visibleProjects.length - 1;
                  
                  return (
                    <motion.div
                      key={project.id}
                      ref={isLastProject && hasMore ? lastProjectRef : null}
                      variants={itemVariants}
                      whileHover="hover"
                      initial="initial"
                      animate="initial"
                      variants={cardVariants}
                      onMouseEnter={() => setHoveredProject(project.id)}
                      onMouseLeave={() => setHoveredProject(null)}
                      className="group"
                    >
                      <div className="bg-gray-900/40 backdrop-blur-2xl border border-gray-700/50 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-500 h-full">
                        {/* Project Image */}
                        <div className="relative h-48 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/50 z-10" />
                          {project.coverImageUrl ? (
                            <img 
                              src={project.coverImageUrl}
                              alt={project.metadata?.title || `Project #${project.id}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              loading="lazy"
                              onLoad={handleImageLoad}
                              style={{ opacity: 0 }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                              <FolderOpen className="w-16 h-16 text-gray-600" />
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          <div className="absolute top-4 left-4 z-20">
                            <div className={`px-4 py-2 rounded-full backdrop-blur-sm border ${statusInfo.color} flex items-center gap-2`}>
                              {statusInfo.icon}
                              <span className="font-medium">{statusInfo.text}</span>
                            </div>
                          </div>
                          
                          {/* ID Badge */}
                          <div className="absolute top-4 right-4 z-20">
                            <div className="px-4 py-2 bg-gray-900/80 backdrop-blur-sm text-purple-300 rounded-full border border-gray-700 flex items-center gap-2">
                              <Hash className="w-4 h-4" />
                              <span className="font-medium">#{project.id}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Project Content */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-100 mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors">
                            {project.metadata?.title || `Project #${project.id}`}
                          </h3>
                          
                          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                            {project.metadata?.description || "No description available"}
                          </p>
                          
                          {/* Tags */}
                          {project.metadata?.tags && project.metadata.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {project.metadata.tags.slice(0, 3).map((tag, tagIndex) => (
                                <span 
                                  key={tagIndex}
                                  className="px-3 py-1 bg-gray-800/50 text-purple-300 text-xs rounded-lg border border-gray-700 flex items-center gap-2"
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                              {project.metadata.tags.length > 3 && (
                                <span className="px-3 py-1 bg-gray-800/50 text-gray-400 text-xs rounded-lg border border-gray-700">
                                  +{project.metadata.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Project Info */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Type</div>
                              <div className="font-medium text-gray-300">{project.metadata?.type || "Unknown"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Version</div>
                              <div className="font-mono text-sm text-gray-300">{project.metadata?.version || "N/A"}</div>
                            </div>
                            {project.formattedDate && (
                              <div className="col-span-2">
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                                  <Calendar className="w-3 h-3" />
                                  Created
                                </div>
                                <div className="text-sm text-gray-300">{project.formattedDate}</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Creator & Actions */}
                          <div className="pt-4 border-t border-gray-700/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-300">Creator</div>
                                  <div className="text-xs text-purple-400">{formatAddress(project.creator)}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleTalkToOwner(
                                    project.id,
                                    project.metadata?.title || `Project #${project.id}`,
                                    project.creator
                                  )}
                                  className={`p-3 rounded-xl transition-all duration-300 ${
                                    account 
                                      ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20"
                                      : "bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-800"
                                  }`}
                                  title={!account ? "Connect wallet to talk to owner" : ""}
                                >
                                  <MessageSquare className="w-5 h-5" />
                                </button>
                                
                                <button
                                  onClick={() => handleViewDetails(project.id)}
                                  className="p-3 border border-gray-700 hover:border-purple-500 text-purple-400 hover:text-purple-300 rounded-xl transition-all duration-300"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Loading States */}
              {loading && visibleProjects.length === 0 && (
                <div className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <ThreeDot 
                      variant="bounce" 
                      color="#8B5CF6"
                      size="medium" 
                      text="" 
                      textColor="" 
                    />
                    <p className="mt-6 text-gray-400">Loading projects from blockchain...</p>
                  </div>
                </div>
              )}

              {loadingMore && (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center justify-center">
                    <ThreeDot 
                      variant="bounce" 
                      color="#8B5CF6"
                      size="small" 
                      text="" 
                      textColor="" 
                    />
                    <p className="mt-4 text-gray-400 text-sm">Loading more projects...</p>
                  </div>
                </div>
              )}

              {hasMore && !loading && !loadingMore && visibleProjects.length > 0 && (
                <div className="text-center pt-8">
                  <button
                    onClick={() => fetchProjects(page, filter)}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 flex items-center gap-3 mx-auto"
                  >
                    <ChevronDown className="w-5 h-5" />
                    Load More Projects
                  </button>
                </div>
              )}

              {!hasMore && visibleProjects.length > 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-900/30 mb-4">
                    <CheckCircle className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-gray-400">
                    You've viewed all {visibleProjects.length} projects
                  </p>
                </div>
              )}

              {!loading && visibleProjects.length === 0 && (
                <div className="text-center py-20 bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-3xl shadow-lg">
                  <div className="w-24 h-24 mx-auto mb-6">
                    <div className="w-full h-full bg-gray-800/50 rounded-2xl flex items-center justify-center">
                      <FolderOpen className="w-12 h-12 text-gray-500" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-3">
                    No projects found
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    {searchTerm 
                      ? `No projects match your search "${searchTerm}".`
                      : filter !== null 
                        ? "No projects match the current filter."
                        : "Be the first to create a project!"}
                  </p>
                  <button
                    onClick={handleCreateProject}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/20 transition-all duration-300"
                  >
                    Create New Project
                  </button>
                </div>
              )}
            </div>

            {/* macOS-style Sidebar */}
            <div className="space-y-6">
              {/* Account Card */}
              <div className="bg-gray-900/40 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl shadow-purple-500/10">
                <h3 className="text-lg font-bold text-gray-100 mb-6 flex items-center gap-3">
                  <User className="w-6 h-6 text-purple-400" />
                  Account Status
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-800/50 border border-gray-700">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      account 
                        ? "bg-gradient-to-r from-purple-600 to-purple-500" 
                        : "bg-gradient-to-r from-gray-700 to-gray-600"
                    }`}>
                      {account ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <Lock className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-100">
                        {account ? "Wallet Connected" : "Connect Wallet"}
                      </div>
                      <div className="text-sm text-purple-400">
                        {account ? formatAddress(account) : "Connect to unlock features"}
                      </div>
                    </div>
                  </div>
                  
                  {account ? (
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/20 transition-all duration-300"
                    >
                      View Profile
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectWallet}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/20 transition-all duration-300"
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-gray-900/40 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl shadow-purple-500/10">
                <h3 className="text-lg font-bold text-gray-100 mb-6 flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-cyan-400" />
                  Status Distribution
                </h3>
                <div className="space-y-4">
                  {Object.values(ProjectStatus).map((status) => {
                    const statusInfo = getStatusInfo(status);
                    const count = projects.filter(p => p.status === status).length;
                    const percentage = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
                    
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${statusInfo.bgColor}`}>
                              {statusInfo.icon}
                            </div>
                            <span className="font-medium text-gray-300">{statusInfo.text}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm ${statusInfo.color}`}>
                            {count}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-800/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full bg-gradient-to-r ${statusInfo.gradient} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-900/40 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl shadow-purple-500/10">
                <h3 className="text-lg font-bold text-gray-100 mb-6 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-purple-400" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Plus, label: "Create Project", action: handleCreateProject, gradient: "from-purple-600 to-purple-500" },
                    { icon: Users, label: "Browse Creators", action: () => navigate('/creators'), gradient: "from-cyan-600 to-blue-500" },
                    { icon: Code2, label: "View Contracts", action: () => navigate('/contracts'), gradient: "from-green-600 to-emerald-500" },
                    { icon: MessageSquare, label: "Messages", action: () => navigate('/messages'), gradient: "from-rose-600 to-pink-500" },
                  ].map((action, index) => (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={action.action}
                      className={`w-full px-4 py-3 bg-gradient-to-r ${action.gradient} text-white rounded-2xl font-medium flex items-center gap-3 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300`}
                    >
                      <action.icon className="w-5 h-5" />
                      <span>{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals remain the same but with macOS styling */}
      {showConnectWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowConnectWalletModal(false)}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-gray-900/95 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-purple-500/20"
          >
            {/* Modal content remains the same */}
          </motion.div>
        </div>
      )}

      {showChatGuide && selectedProjectForChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowChatGuide(false);
              setSelectedProjectForChat(null);
            }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-gray-900/95 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-purple-500/20"
          >
            {/* Modal content remains the same */}
          </motion.div>
        </div>
      )}

      {/* Mobile Stats Bar */}
      {windowWidth < 1024 && visibleProjects.length > 0 && (
        <div className="lg:hidden fixed bottom-20 left-0 right-0 z-20 px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gray-900/95 backdrop-blur-2xl border border-gray-700/50 rounded-2xl p-4 shadow-2xl shadow-purple-500/10"
          >
            <div className="flex items-center justify-around">
              {[
                { value: totalProjects, label: "Total" },
                { value: projects.filter(p => p.status === ProjectStatus.Funding).length, label: "Active" },
                { value: projects.filter(p => p.coverImageUrl).length, label: "With Images" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-sm font-bold text-gray-100">{stat.value}</div>
                  <div className="text-xs text-purple-400">{stat.label}</div>
                </div>
              ))}
              {!account && (
                <button
                  onClick={handleConnectWallet}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-xl shadow shadow-purple-500/20"
                >
                  Login
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HomeLand;