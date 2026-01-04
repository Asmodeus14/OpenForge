import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { 
  Home, 
  Briefcase, 
  Users, 
  Bell, 
  MessageSquare, 
  Bookmark, 
  LogIn,
  Settings,
  HelpCircle,
  Search,
  Plus,
  Menu,
  X,
  User,
} from "lucide-react";

// Import ABIs and addresses
import { 
  PROJECT_CONTRACT_ADDRESS, 
  ProjectRegistryABI, 
  ProjectStatus 
} from '../contracts/ProjectRegistryABI';
import { 
  PROFILE_CONTRACT_ADDRESS, 
  ProfileRegistryABI, 
  type ProfileMetadata 
} from '../contracts/ProfileRegistryABI';

// Import OpenForge contract
import { OpenForgeProjectRegistryABI, REGISTRY_ADDRESS } from '../ESCROW/ABI';

// Import hooks and utilities
import { useWeb3 } from "../hooks/web3";
import LogoSVG from "../component/Logo";
import { getProfileFlow } from "../Flows/GetProfile";

interface ProfileData {
  name?: string;
  avatar?: {
    cid: string;
    type: string;
  };
}

// Helper to extract links from text
const extractLinksFromText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];
  
  const links = matches.map(url => {
    let name = url;
    try {
      const urlObj = new URL(url);
      name = urlObj.hostname.replace('www.', '');
      if (urlObj.hostname.includes('github.com')) name = 'GitHub';
      else if (urlObj.hostname.includes('vercel.app')) name = 'Live Demo';
      else if (urlObj.hostname.includes('netlify.app')) name = 'Live Demo';
    } catch (e) {}
    
    return { name, url };
  });
  
  return links;
};

// Helper to extract tech stack from text
const extractTechStack = (text: string) => {
  const techKeywords = [
    'React', 'TypeScript', 'JavaScript', 'Next.js', 'Vue', 'Angular',
    'Node.js', 'Express', 'Python', 'Django', 'FastAPI',
    'Solidity', 'Ethers', 'Web3.js', 'Hardhat', 'Foundry',
    'Tailwind', 'CSS', 'HTML', 'IPFS', 'MongoDB', 'PostgreSQL',
    'Docker', 'Kubernetes', 'AWS', 'Firebase', 'GraphQL'
  ];
  
  const foundTech = techKeywords.filter(tech => 
    new RegExp(`\\b${tech}\\b`, 'i').test(text)
  );
  
  return Array.from(new Set(foundTech));
};

// Helper to fetch IPFS data
const fetchIPFSData = async (cid: string): Promise<any> => {
  try {
    const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
    if (!response.ok) throw new Error('Failed to fetch IPFS data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching IPFS data:', error);
    return null;
  }
};

// Helper to truncate text
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { account } = useWeb3();
  
  // Project data states
  const [projectData, setProjectData] = useState<any>(null);
  const [projectMetadata, setProjectMetadata] = useState<any>(null);
  const [builderProfile, setBuilderProfile] = useState<ProfileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'contributions'>('overview');
  const [isStarred, setIsStarred] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [fundedProjects, setFundedProjects] = useState<any[]>([]);
  const [loadingFundedProjects, setLoadingFundedProjects] = useState(false);
  
  // Sidebar states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarProfileData, setSidebarProfileData] = useState<ProfileData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

  // Format date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status string
  const getStatusString = (statusCode: number): string => {
    switch(statusCode) {
      case ProjectStatus.Draft: return 'Draft';
      case ProjectStatus.Funding: return 'Funding';
      case ProjectStatus.Completed: return 'Completed';
      case ProjectStatus.Failed: return 'Failed';
      default: return 'Active';
    }
  };

  // Get status color
  const getStatusColor = (statusCode: number): string => {
    switch(statusCode) {
      case ProjectStatus.Funding: return 'bg-purple-500/20 text-purple-300';
      case ProjectStatus.Completed: return 'bg-green-500/20 text-green-300';
      case ProjectStatus.Failed: return 'bg-red-500/20 text-red-300';
      case ProjectStatus.Draft: return 'bg-gray-700 text-gray-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  // Initialize ethers provider
  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        try {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);
        } catch (err) {
          console.error('Error initializing provider:', err);
        }
      } else {
        console.warn('No Ethereum provider found. Using read-only mode.');
        const publicProvider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo');
        setProvider(publicProvider as any);
      }
    };

    initProvider();
  }, []);

  // Sidebar helper functions
  const getInitials = (addr: string) => {
    return addr.slice(2, 4).toUpperCase();
  };

  const getColorFromAddress = (addr: string) => {
    const colors = [
      "from-purple-500 to-violet-600",
      "from-violet-500 to-purple-600",
      "from-fuchsia-500 to-purple-500",
      "from-purple-600 to-violet-700"
    ];
    const index = parseInt(addr.slice(2, 4), 16) % colors.length;
    return colors[index];
  };

  // Load avatar from IPFS
  const loadAvatar = async (cid: string): Promise<void> => {
    try {
      const ipfsGateway = "https://ipfs.io/ipfs/";
      const url = `${ipfsGateway}${cid}`;
      
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        setAvatarUrl(url);
      } else {
        const extensions = ['', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
        for (const ext of extensions) {
          const testUrl = `${ipfsGateway}${cid}${ext}`;
          try {
            const testResponse = await fetch(testUrl, { method: 'HEAD' });
            if (testResponse.ok) {
              setAvatarUrl(testUrl);
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Failed to load avatar:", error);
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  // Get sidebar profile data
  useEffect(() => {
    const fetchSidebarProfileData = async () => {
      if (!account) {
        setSidebarProfileData(null);
        setAvatarUrl("");
        return;
      }

      try {
        const cid = await getProfileFlow(account);
        if (!cid) {
          setSidebarProfileData(null);
          setAvatarUrl("");
          return;
        }

        const ipfsGateway = "https://ipfs.io/ipfs/";
        const response = await fetch(`${ipfsGateway}${cid}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSidebarProfileData(data);
          
          if (data.avatar && data.avatar.cid) {
            setIsLoadingAvatar(true);
            await loadAvatar(data.avatar.cid);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      }
    };

    fetchSidebarProfileData();
  }, [account]);

  // All navigation items
  const allNavItems = [
    { id: "home", icon: Home, label: "Home", mobile: true, path: "/home" },
    { id: "projects", icon: Briefcase, label: "Projects", mobile: false, path: "/projects" },
    { id: "talent", icon: Users, label: "Talent", mobile: false, path: "/talent" },
    { id: "messages", icon: MessageSquare, label: "Messages", mobile: true, path: "/messages" },
    { id: "contracts", icon: Bell, label: "Notifications", mobile: true, path: "/contracts/:action?" },
    { id: "saved", icon: Bookmark, label: "Saved", mobile: false, path: "/saved" },
  ];

  // Mobile navigation items
  const mobileNavItems = allNavItems.filter(item => item.mobile);

  const handleSidebarTabClick = (tabId: string) => {
    const navItem = allNavItems.find(item => item.id === tabId);
    if (navItem) {
      navigate(navItem.path);
    }
    setIsMobileMenuOpen(false);
  };

  const handleSidebarCreateClick = () => {
    if (account) {
      navigate("/create");
    } else {
      navigate("/login");
    }
    setIsMobileMenuOpen(false);
  };

  const handleSidebarProfileClick = () => {
    if (account) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
    setIsMobileMenuOpen(false);
  };

  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId || !provider) return;

      try {
        setLoading(true);
        setError(null);
        
        const projectContract = new ethers.Contract(
          PROJECT_CONTRACT_ADDRESS,
          ProjectRegistryABI,
          provider
        );

        const profileContract = new ethers.Contract(
          PROFILE_CONTRACT_ADDRESS,
          ProfileRegistryABI,
          provider
        );

        const projectIdNum = BigInt(projectId);
        console.log('Fetching project data for ID:', projectId);

        const [builderAddress, metadataCID, statusCode] = await projectContract.getProject(projectIdNum);
        
        if (!metadataCID || metadataCID === '') {
          throw new Error('Project metadata not found');
        }

        // Fetch project metadata from IPFS
        const metadata = await fetchIPFSData(metadataCID);
        
        if (!metadata) {
          throw new Error('Failed to load project metadata from IPFS');
        }

        setProjectMetadata(metadata);

        // Get builder profile
        let profileData: ProfileMetadata | null = null;
        try {
          const profileCID = await profileContract.getProfile(builderAddress);
          
          if (profileCID && profileCID !== '') {
            const profileMetadata = await fetchIPFSData(profileCID);
            if (profileMetadata) {
              profileData = {
                ...profileMetadata,
                type: 'profile',
                version: profileMetadata.version || '1.0',
                name: profileMetadata.name || 'Anonymous Builder',
                bio: profileMetadata.bio || '',
                skills: profileMetadata.skills || [],
                createdAt: profileMetadata.createdAt || Date.now(),
                updatedAt: profileMetadata.updatedAt,
                avatar: profileMetadata.avatar
              };
            }
          }
        } catch (profileErr) {
          console.warn('Could not fetch builder profile:', profileErr);
          profileData = {
            type: 'profile',
            version: '1.0',
            name: `${builderAddress.slice(0, 6)}...${builderAddress.slice(-4)}`,
            bio: 'Web3 Builder',
            skills: [],
            createdAt: Date.now()
          };
        }

        setBuilderProfile(profileData);

        // Extract additional data from description
        const extractedLinks = extractLinksFromText(metadata.description || '');
        const extractedTech = extractTechStack(metadata.description || '');

        // Combine all data
        const combinedData = {
          id: projectIdNum.toString(),
          builder: builderAddress,
          statusCode: Number(statusCode),
          status: getStatusString(Number(statusCode)),
          metadataCID,
          
          title: metadata.title || 'Untitled Project',
          description: metadata.description || '',
          tags: metadata.tags || [],
          images: metadata.images || [],
          createdAt: metadata.createdAt || Date.now(),
          version: metadata.version || '1.0',
          type: metadata.type || 'project',
          
          extractedLinks,
          extractedTech,
          
          stars: 0,
          contributors: 0,
          
          funding: {
            target: 0,
            raised: 0,
            currency: 'ETH',
            progress: 0
          },
          
          milestones: []
        };

        setProjectData(combinedData);
        console.log('Project data loaded:', combinedData);

      } catch (err: any) {
        console.error('Error fetching project data:', err);
        setError(err.message || 'Failed to load project data from blockchain');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, provider]);

  // Fetch projects funded by the builder
  useEffect(() => {
    const fetchFundedProjects = async () => {
      if (!projectData || !projectData.builder || !provider) return;

      try {
        setLoadingFundedProjects(true);
        
        const openForgeContract = new ethers.Contract(
          REGISTRY_ADDRESS,
          OpenForgeProjectRegistryABI,
          provider
        );

        console.log('Fetching projects for builder:', projectData.builder);
        const projectIds = await openForgeContract.getUserProjects(projectData.builder);
        
        const fundedProjectsPromises = projectIds.map(async (id: bigint) => {
          try {
            const project = await openForgeContract.getProject(id);
            
            if (project.funder.toLowerCase() === projectData.builder.toLowerCase()) {
              let escrowInfo = null;
              try {
                escrowInfo = await openForgeContract.getEscrowInfo(id);
              } catch (e) {
                console.warn('Could not fetch escrow info for project:', id);
              }

              let metadata = null;
              try {
                const cid = await openForgeContract.projectCIDs(id);
                if (cid && cid !== '') {
                  metadata = await fetchIPFSData(cid);
                }
              } catch (e) {
                console.warn('Could not fetch metadata for project:', id);
              }

              return {
                id: id.toString(),
                projectId: id.toString(),
                escrowAddress: project.escrowAddress,
                funder: project.funder,
                developer: project.developer,
                title: project.title || (metadata?.title || 'Untitled Project'),
                description: project.description || (metadata?.description || ''),
                tags: project.tags || (metadata?.tags || []),
                createdAt: Number(project.createdAt),
                updatedAt: Number(project.updatedAt),
                active: project.active,
                status: project.active ? 'Active' : 'Inactive',
                metadata: metadata,
                escrowInfo: escrowInfo ? {
                  escrowAddress: escrowInfo.escrowAddress,
                  paymentToken: escrowInfo.paymentToken,
                  totalAmount: escrowInfo.totalAmount ? ethers.formatEther(escrowInfo.totalAmount) : '0',
                  milestoneAmounts: escrowInfo.milestoneAmounts ? escrowInfo.milestoneAmounts.map((amt: bigint) => ethers.formatEther(amt)) : [],
                  milestoneDescriptions: escrowInfo.milestoneDescriptions || []
                } : null
              };
            }
            return null;
          } catch (err) {
            console.error('Error fetching project details for ID:', id, err);
            return null;
          }
        });

        const projects = (await Promise.all(fundedProjectsPromises))
          .filter(project => project !== null)
          .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

        setFundedProjects(projects);
        console.log('Funded projects loaded:', projects);
      } catch (err: any) {
        console.error('Error fetching funded projects:', err);
      } finally {
        setLoadingFundedProjects(false);
      }
    };

    if (projectData) {
      fetchFundedProjects();
    }
  }, [projectData, provider]);

  // Handle contribute click with all URL parameters
  const handleContributeClick = () => {
    if (projectData && projectMetadata) {
      const basePath = '/contracts/deploy';
      const queryParams = new URLSearchParams();
      
      queryParams.append('title', projectData.title || 'Untitled Project');
      queryParams.append('description', projectMetadata.description || '');
      
      if (projectData.tags && projectData.tags.length > 0) {
        queryParams.append('tags', projectData.tags.join(','));
      }
      
      queryParams.append('developer', projectData.builder);
      
      if (projectId) {
        queryParams.append('projectId', projectId);
      }
      
      navigate(`${basePath}?${queryParams.toString()}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Mobile Top Bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-gray-900">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center border border-purple-500/20">
                <LogoSVG className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                OpenForge
              </span>
            </button>

            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors">
                <Search className="w-5 h-5" />
              </button>
              {account && (
                <button 
                  onClick={() => handleSidebarTabClick("contracts")}
                  className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-black"></span>
                </button>
              )}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:flex lg:left-6 lg:top-1/2 lg:-translate-y-1/2 z-50">
          <div className="flex flex-col items-center gap-4 p-4 bg-black/95 backdrop-blur-2xl rounded-3xl border border-gray-900 shadow-2xl">
            <div className="mb-1">
              <button
                onClick={() => navigate("/")}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 border border-purple-500/20"
              >
                <LogoSVG className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex-1 pt-20 lg:pt-0">
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading project from blockchain...</p>
              <p className="text-sm text-gray-500 mt-2">Project ID: {projectId}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !projectData || !projectMetadata) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Mobile Top Bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-gray-900">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center border border-purple-500/20">
                <LogoSVG className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                OpenForge
              </span>
            </button>

            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors">
                <Search className="w-5 h-5" />
              </button>
              {account && (
                <button 
                  onClick={() => handleSidebarTabClick("contracts")}
                  className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-black"></span>
                </button>
              )}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:flex lg:left-6 lg:top-1/2 lg:-translate-y-1/2 z-50">
          <div className="flex flex-col items-center gap-4 p-4 bg-black/95 backdrop-blur-2xl rounded-3xl border border-gray-900 shadow-2xl">
            <div className="mb-1">
              <button
                onClick={() => navigate("/")}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 border border-purple-500/20"
              >
                <LogoSVG className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="flex-1 pt-20 lg:pt-0">
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="max-w-md p-6 bg-gray-900 rounded-2xl border border-gray-800">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Blockchain Error</h2>
              <p className="text-gray-300 mb-2">{error || 'Project not found on blockchain'}</p>
              <p className="text-sm text-gray-500 mb-4">
                Project ID: {projectId}<br />
                Contract: {PROJECT_CONTRACT_ADDRESS.slice(0, 10)}...
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no images in metadata, use placeholder
  const coverImage = projectMetadata.images && projectMetadata.images.length > 0 
    ? `https://ipfs.io/ipfs/${projectMetadata.images[0].cid}`
    : 'https://via.placeholder.com/1200x400/1a1a1a/666666?text=Project+Cover';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b border-gray-900">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center border border-purple-500/20">
              <LogoSVG className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
              OpenForge
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>
            {account && (
              <button 
                onClick={() => handleSidebarTabClick("contracts")}
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-black"></span>
              </button>
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="px-4 py-3 border-t border-gray-900 bg-black/95 backdrop-blur-2xl">
            <div className="space-y-2">
              {allNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSidebarTabClick(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-300"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              
              {account && (
                <button 
                  onClick={handleSidebarCreateClick}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg border border-purple-500/30"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New</span>
                </button>
              )}

              <div className="pt-3 mt-3 border-t border-gray-900">
                <button onClick={() => navigate("/settings")} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>
                <button onClick={() => navigate("/help")} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-medium">Help</span>
                </button>
                {account ? (
                  <button 
                    onClick={handleSidebarProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    {avatarUrl ? (
                      <div className="w-8 h-8 rounded-xl overflow-hidden border border-purple-500/30">
                        <img 
                          src={avatarUrl} 
                          alt={sidebarProfileData?.name || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${getColorFromAddress(account)} border border-purple-500/30`}>
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="font-medium">{sidebarProfileData?.name || "Profile"}</span>
                  </button>
                ) : (
                  <button onClick={() => navigate("/login")} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                    <LogIn className="w-5 h-5" />
                    <span className="font-medium">Login</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:flex lg:left-6 lg:top-1/2 lg:-translate-y-1/2 z-50">
        <div className="flex flex-col items-center gap-4 p-4 bg-black/95 backdrop-blur-2xl rounded-3xl border border-gray-900 shadow-2xl">
          
          {/* Logo */}
          <div className="mb-1">
            <button
              onClick={() => navigate("/")}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 border border-purple-500/20"
            >
              <LogoSVG className="w-7 h-7 text-white" />
            </button>
          </div>

          {/* Navigation Icons */}
          <nav className="flex flex-col items-center gap-3">
            {allNavItems.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleSidebarTabClick(item.id)}
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-900 text-gray-400 hover:text-purple-400 hover:bg-gray-800 hover:border hover:border-gray-700 hover:shadow-md transition-all duration-300"
                >
                  <item.icon className="w-5 h-5" />
                </button>
                
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                  {item.label}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
                </div>
              </div>
            ))}
          </nav>

          {/* Divider */}
          <div className="w-8 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-2"></div>

          {/* Settings & Help */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <button onClick={() => navigate("/settings")} className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-900 text-gray-400 hover:text-purple-400 hover:bg-gray-800 hover:border hover:border-gray-700 transition-all duration-300">
                <Settings className="w-5 h-5" />
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                Settings
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
              </div>
            </div>

            <div className="relative group">
              <button onClick={() => navigate("/help")} className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-900 text-gray-400 hover:text-purple-400 hover:bg-gray-800 hover:border hover:border-gray-700 transition-all duration-300">
                <HelpCircle className="w-5 h-5" />
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                Help
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
              </div>
            </div>
          </div>

          {/* Create Button */}
          {account && (
            <div className="relative group">
              <button
                onClick={handleSidebarCreateClick}
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-900/30 hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 border border-purple-500/30"
              >
                <Plus className="w-5 h-5" />
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                Create
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
              </div>
            </div>
          )}

          {/* User Avatar / Login */}
          <div className="mt-2">
            {account ? (
              <div className="relative group">
                <button
                  onClick={handleSidebarProfileClick}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 overflow-hidden border-2 ${
                    avatarUrl 
                      ? "border-purple-500/30"
                      : `bg-gradient-to-r ${getColorFromAddress(account)} border-purple-500/20`
                  }`}
                >
                  {isLoadingAvatar ? (
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-400 animate-pulse" />
                    </div>
                  ) : avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={sidebarProfileData?.name || "Profile"}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarUrl("")}
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">{getInitials(account)}</span>
                  )}
                </button>
                
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                  {sidebarProfileData?.name || "Profile"}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <button
                  onClick={() => navigate("/login")}
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-900 text-gray-400 hover:text-purple-400 hover:bg-gray-800 hover:border hover:border-gray-700 transition-all duration-300"
                >
                  <LogIn className="w-5 h-5" />
                </button>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800">
                  Login
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-gray-800"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-t border-gray-900 py-3 px-6">
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSidebarTabClick(item.id)}
              className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-400 transition-colors"
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}

          {account && (
            <button onClick={handleSidebarCreateClick} className="flex flex-col items-center p-2">
              <div className="w-14 h-14 -mt-8 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 flex items-center justify-center shadow-xl border border-purple-500/30">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-purple-300 mt-1">Create</span>
            </button>
          )}

          {account ? (
            <button
              onClick={handleSidebarProfileClick}
              className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-400 transition-colors"
            >
              {avatarUrl ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-purple-500/30 shadow-sm">
                  <img 
                    src={avatarUrl} 
                    alt={sidebarProfileData?.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorFromAddress(account)} border-2 border-purple-500/30`}>
                  <span className="text-sm font-bold text-white">{getInitials(account)}</span>
                </div>
              )}
              <span className="text-xs font-medium mt-1">Me</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-400 transition-colors"
            >
              <LogIn className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 lg:pt-0 lg:ml-24">
        {/* Hero Section */}
        <div className="relative h-[300px] sm:h-[350px] md:h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/90 to-black z-10"></div>
          
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${coverImage})`,
              filter: 'brightness(0.3)'
            }}
          ></div>
          
          <div className="relative z-20 h-full flex flex-col justify-end">
            <div className="container mx-auto px-4 pb-6 md:pb-8">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
                  {projectData.tags.slice(0, 3).map((tag: string, index: number) => (
                    <div key={index} className="px-2 md:px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs md:text-sm font-medium text-purple-300">
                      {tag}
                    </div>
                  ))}
                  <div className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${getStatusColor(projectData.statusCode)}`}>
                    {projectData.status}
                  </div>
                </div>
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3">
                  {projectData.title}
                </h1>
                
                {builderProfile && (
                  <div className="mb-3 md:mb-4">
                    <Link 
                      to={`/profile/${projectData.builder}`}
                      className="inline-flex items-center gap-2 group hover:bg-gray-900/50 px-2 md:px-3 py-1 md:py-2 rounded-lg transition-colors"
                    >
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-800 border border-gray-700 overflow-hidden">
                        {builderProfile.avatar?.cid ? (
                          <img 
                            src={`https://ipfs.io/ipfs/${builderProfile.avatar.cid}`}
                            alt={builderProfile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-600">
                            {builderProfile.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-sm md:text-base text-gray-300 group-hover:text-white transition-colors">
                        {builderProfile.name}
                      </span>
                      <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
            {/* Left Column */}
            <div className="lg:w-2/3">
              {/* Stats Card */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 md:p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto">
                    <div className="text-center">
                      <div className="text-lg md:text-xl font-bold">{projectData.contributors || 0}</div>
                      <div className="text-xs md:text-sm text-gray-400">Contributors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-xl font-bold">{projectData.stars || 0}</div>
                      <div className="text-xs md:text-sm text-gray-400">Stars</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-xl font-bold">{formatDate(projectData.createdAt)}</div>
                      <div className="text-xs md:text-sm text-gray-400">Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-xl font-bold">{fundedProjects.length}</div>
                      <div className="text-xs md:text-sm text-gray-400">Funded</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setIsStarred(!isStarred)}
                      className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg font-medium transition-all ${
                        isStarred
                          ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'
                          : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {isStarred ? '★ Starred' : '☆ Star'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6">
                <div className="flex border-b border-gray-800 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 md:px-6 py-2 md:py-3 text-base md:text-lg font-medium whitespace-nowrap relative ${
                      activeTab === 'overview'
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Overview
                    {activeTab === 'overview' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('milestones')}
                    className={`px-3 md:px-6 py-2 md:py-3 text-base md:text-lg font-medium whitespace-nowrap relative ${
                      activeTab === 'milestones'
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Milestones
                    {activeTab === 'milestones' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('contributions')}
                    className={`px-3 md:px-6 py-2 md:py-3 text-base md:text-lg font-medium whitespace-nowrap relative ${
                      activeTab === 'contributions'
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Contributions
                    {activeTab === 'contributions' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4 md:p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4 md:space-y-6">
                    <div className="space-y-2 md:space-y-3">
                      <h2 className="text-xl md:text-2xl font-bold">Project Description</h2>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                        {projectData.description || 'No description provided.'}
                      </p>
                    </div>

                    {projectData.extractedLinks.length > 0 && (
                      <div className="space-y-2 md:space-y-3">
                        <h3 className="text-lg md:text-xl font-bold">Project Links</h3>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                          {projectData.extractedLinks.map((link: any, index: number) => (
                            <a
                              key={index}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 md:px-4 py-1 md:py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors flex items-center gap-1 md:gap-2 text-sm"
                            >
                              {link.name === 'GitHub' && (
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                              )}
                              <span>{link.name}</span>
                              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {projectData.extractedTech.length > 0 && (
                      <div className="space-y-2 md:space-y-3">
                        <h3 className="text-lg md:text-xl font-bold">Technology Used</h3>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          {projectData.extractedTech.map((tech: string, index: number) => (
                            <div
                              key={index}
                              className="px-2 md:px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-lg text-xs md:text-sm font-medium"
                            >
                              {tech}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 md:space-y-3">
                      <h3 className="text-lg md:text-xl font-bold">Project Details</h3>
                      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 md:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <div className="text-xs md:text-sm text-gray-400 mb-1">Project ID</div>
                            <div className="font-medium text-sm md:text-base">{projectData.id}</div>
                          </div>
                          <div>
                            <div className="text-xs md:text-sm text-gray-400 mb-1">Type</div>
                            <div className="font-medium text-sm md:text-base capitalize">{projectData.type}</div>
                          </div>
                          <div>
                            <div className="text-xs md:text-sm text-gray-400 mb-1">Version</div>
                            <div className="font-medium text-sm md:text-base">{projectData.version}</div>
                          </div>
                          <div>
                            <div className="text-xs md:text-sm text-gray-400 mb-1">Status</div>
                            <div className={`px-2 py-1 rounded text-xs md:text-sm font-medium inline-block ${getStatusColor(projectData.statusCode)}`}>
                              {projectData.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'milestones' && (
                  <div className="space-y-4 md:space-y-6">
                    <h2 className="text-xl md:text-2xl font-bold">Project Milestones</h2>
                    
                    {projectData.milestones && projectData.milestones.length > 0 ? (
                      <div className="space-y-4 md:space-y-6">
                        {projectData.milestones.map((milestone: any) => (
                          <div
                            key={milestone.id}
                            className="p-3 md:p-4 border border-gray-800 rounded-lg hover:border-purple-500/30 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 md:mb-3">
                              <h3 className="text-base md:text-lg font-bold">{milestone.title}</h3>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                milestone.status === 'completed'
                                  ? 'bg-green-500/20 text-green-300'
                                  : milestone.status === 'in-progress'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-gray-800 text-gray-400'
                              }`}>
                                {milestone.status}
                              </div>
                            </div>
                            <p className="text-gray-400 text-sm md:text-base">{milestone.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 md:py-8 border border-gray-800 rounded-lg">
                        <p className="text-gray-400">No milestones defined yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'contributions' && (
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <h2 className="text-xl md:text-2xl font-bold">
                        Projects Funded by {builderProfile?.name || 'Builder'}
                      </h2>
                      <div className="text-sm text-gray-400">
                        Total: {fundedProjects.length} projects
                      </div>
                    </div>

                    {loadingFundedProjects ? (
                      <div className="text-center py-6 md:py-8">
                        <div className="animate-spin rounded-full h-6 md:h-8 w-6 md:w-8 border-b-2 border-purple-500 mx-auto"></div>
                        <p className="mt-3 md:mt-4 text-gray-400 text-sm md:text-base">Loading funded projects...</p>
                      </div>
                    ) : fundedProjects.length > 0 ? (
                      <div className="space-y-3 md:space-y-4">
                        {fundedProjects.map((project: any) => (
                          <div
                            key={project.id}
                            className="p-3 md:p-4 border border-gray-800 rounded-lg hover:border-purple-500/30 transition-colors bg-gray-900/30"
                          >
                            <div className="flex flex-col gap-3 md:gap-4">
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                  <h3 className="text-base md:text-lg font-bold text-white">
                                    <Link 
                                      to={`/projects/${project.id}`}
                                      className="hover:text-purple-300 transition-colors"
                                    >
                                      {project.title}
                                    </Link>
                                  </h3>
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    project.active 
                                      ? 'bg-green-500/20 text-green-300' 
                                      : 'bg-gray-700 text-gray-400'
                                  }`}>
                                    {project.status}
                                  </div>
                                </div>
                                
                                <p className="text-gray-400 text-xs md:text-sm mb-2 md:mb-3">
                                  {truncateText(project.description || 'No description', 120)}
                                </p>
                                
                                <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-3">
                                  {project.tags && project.tags.slice(0, 3).map((tag: string, index: number) => (
                                    <span
                                      key={index}
                                      className="px-2 py-0.5 md:py-1 bg-gray-800/50 border border-gray-700 rounded text-xs font-medium"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                                  <div>
                                    <div className="text-gray-400 mb-1">Developer</div>
                                    <div className="font-medium text-purple-300">
                                      <Link 
                                        to={`/profile/${project.developer}`}
                                        className="hover:text-purple-200 transition-colors"
                                      >
                                        {`${project.developer.slice(0, 6)}...${project.developer.slice(-4)}`}
                                      </Link>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400 mb-1">Created</div>
                                    <div className="font-medium">{formatDate(project.createdAt)}</div>
                                  </div>
                                </div>
                              </div>
                              
                              {project.escrowInfo && (
                                <div className="border-t border-gray-800 pt-3 md:pt-0 md:border-t-0 md:border-l md:pl-3 md:ml-3">
                                  <div className="space-y-2 md:space-y-3">
                                    <div>
                                      <div className="text-gray-400 text-xs md:text-sm mb-1">Total Funding</div>
                                      <div className="text-base md:text-lg font-bold text-green-300">
                                        {parseFloat(project.escrowInfo.totalAmount).toFixed(4)} ETH
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="text-gray-400 text-xs md:text-sm mb-1">Milestones</div>
                                      <div className="text-xs md:text-sm">
                                        {project.escrowInfo.milestoneDescriptions.length} milestones
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="text-gray-400 text-xs md:text-sm mb-1">Escrow</div>
                                      <div className="text-xs font-mono text-gray-300 truncate">
                                        {project.escrowAddress.slice(0, 8)}...{project.escrowAddress.slice(-6)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 md:py-8 border border-gray-800 rounded-lg">
                        <p className="text-gray-400">No funded projects found for this builder</p>
                        <p className="text-xs md:text-sm text-gray-500 mt-2">
                          This builder hasn't funded any projects yet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Funding Card */}
            <div className="lg:w-1/3">
              <div className="sticky top-6 md:top-8">
                {/* Funding Card */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 md:p-6 mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Project Funding</h3>
                  
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <div className="flex justify-between text-xs md:text-sm text-gray-400 mb-1">
                        <span>Raised</span>
                        <span>{projectData.funding.progress.toFixed(1)}%</span>
                      </div>
                      <div className="text-xl md:text-2xl font-bold mb-1">
                        {projectData.funding.raised.toLocaleString()} {projectData.funding.currency}
                      </div>
                      <div className="text-xs md:text-sm text-gray-400">
                        of {projectData.funding.target.toLocaleString()} {projectData.funding.currency} goal
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="w-full bg-gray-800 rounded-full h-1.5 md:h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 md:h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(projectData.funding.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={handleContributeClick}
                      disabled={projectData.statusCode !== ProjectStatus.Funding}
                      className={`w-full py-2.5 md:py-3 font-bold rounded-lg transition-all duration-200 mt-3 md:mt-4 text-sm md:text-base ${
                        projectData.statusCode === ProjectStatus.Funding
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                          : 'bg-gray-800 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {projectData.statusCode === ProjectStatus.Funding 
                        ? 'Contribute to Project' 
                        : `Funding ${projectData.status.toLowerCase()}`}
                    </button>
                    
                    <div className="text-center text-xs md:text-sm text-gray-400 pt-3 md:pt-4 border-t border-gray-800">
                      <p>Support this project on the blockchain</p>
                    </div>
                  </div>
                </div>

                {/* Builder Info */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4 md:p-6 mb-4 md:mb-6">
                  <h4 className="text-base md:text-lg font-bold mb-3 md:mb-4">Builder Information</h4>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-800 border border-gray-700 overflow-hidden flex-shrink-0">
                        {builderProfile?.avatar?.cid ? (
                          <img 
                            src={`https://ipfs.io/ipfs/${builderProfile.avatar.cid}`}
                            alt={builderProfile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-600">
                            {builderProfile?.name?.charAt(0) || 'B'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm md:text-base truncate">{builderProfile?.name}</div>
                        <div className="text-xs md:text-sm text-gray-400 truncate">
                          {builderProfile?.skills?.slice(0, 2).join(', ') || 'Web3 Builder'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 md:space-y-2 pt-2 border-t border-gray-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs md:text-sm text-gray-400">Projects Funded</span>
                        <span className="font-medium text-sm md:text-base">{fundedProjects.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs md:text-sm text-gray-400">Address</span>
                        <span className="font-mono text-xs md:text-sm text-purple-300">
                          {projectData.builder.slice(0, 6)}...{projectData.builder.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4 md:p-6">
                  <h4 className="text-base md:text-lg font-bold mb-3 md:mb-4">On-Chain Information</h4>
                  <div className="space-y-1.5 md:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-400">Project ID</span>
                      <span className="font-medium font-mono text-xs md:text-sm">{projectData.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-400">Builder</span>
                      <Link 
                        to={`/profile/${projectData.builder}`}
                        className="font-medium text-purple-300 hover:text-purple-200 transition-colors text-xs md:text-sm"
                      >
                        View Profile
                      </Link>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-400">Status</span>
                      <div className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs font-medium ${getStatusColor(projectData.statusCode)}`}>
                        {projectData.status}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-400">Created</span>
                      <span className="font-medium text-xs md:text-sm">{formatDate(projectData.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40">
          <button
            onClick={handleContributeClick}
            disabled={projectData.statusCode !== ProjectStatus.Funding}
            className={`px-4 py-2 md:px-6 md:py-3 font-bold rounded-lg shadow-lg transition-all duration-200 text-sm md:text-base ${
              projectData.statusCode === ProjectStatus.Funding
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple-500/20 hover:shadow-purple-500/30'
                : 'bg-gray-800 text-gray-400 cursor-not-allowed shadow-gray-800/20'
            }`}
          >
            {projectData.statusCode === ProjectStatus.Funding ? 'Contribute Now' : 'Funding Closed'}
          </button>
        </div>

        {/* Contract Info Footer */}
        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-900 pb-20 lg:pb-8">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-500 text-xs md:text-sm">
              <p>Project data loaded from blockchain contract at {PROJECT_CONTRACT_ADDRESS.slice(0, 10)}...</p>
              <p className="mt-1">Metadata loaded from IPFS</p>
              <p className="mt-1">Funding data from OpenForge at {REGISTRY_ADDRESS.slice(0, 10)}...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;