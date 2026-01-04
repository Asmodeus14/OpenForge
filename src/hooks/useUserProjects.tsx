// hooks/useUserProjects.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import {
  OpenForgeProjectRegistryABI,
  REGISTRY_ADDRESS
} from '../ESCROW/ABI';

export interface Project {
  projectId: number;
  escrowAddress: string;
  funder: string;
  developer: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  active: boolean;
  status?: string;
  totalAmount?: string;
  releasedAmount?: string;
  paymentToken?: string;
  paymentTokenSymbol?: string;
  paymentTokenDecimals?: number;
  milestones?: any[];
  userRole?: 'funder' | 'developer';
}

export interface FundingStats {
  totalProjects: number;
  fundedByOthers: number;
  fundedOthers: number;
  activeProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  disputedProjects: number;
  totalFundingReceived: string;
  totalFundingGiven: string;
  averageContractValue: string;
  successRate: number;
}

const getProvider = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      return new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      console.warn('Failed to connect to wallet, using fallback provider');
    }
  }
  
  const publicRpcUrl = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
  return new ethers.JsonRpcProvider(publicRpcUrl);
};

export const useUserProjects = (walletAddress?: string) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [fundingStats, setFundingStats] = useState<FundingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    const init = async () => {
      const prov = await getProvider();
      setProvider(prov);
      
      if (prov instanceof ethers.BrowserProvider) {
        try {
          const sig = await prov.getSigner();
          setSigner(sig);
        } catch (err) {
          console.warn('Could not get signer, using provider only');
        }
      }
    };
    
    init();
  }, []);

  const fetchUserProjects = useCallback(async (address: string) => {
    if (!address || !provider) return;

    setLoading(true);
    setLoadingStats(true);
    setError(null);

    try {
      const registry = new ethers.Contract(
        REGISTRY_ADDRESS,
        OpenForgeProjectRegistryABI,
        provider
      );

      const projectIds = await registry.getUserProjects(address);

      if (projectIds.length === 0) {
        setProjects([]);
        setFundingStats({
          totalProjects: 0,
          fundedByOthers: 0,
          fundedOthers: 0,
          activeProjects: 0,
          completedProjects: 0,
          cancelledProjects: 0,
          disputedProjects: 0,
          totalFundingReceived: '0',
          totalFundingGiven: '0',
          averageContractValue: '0',
          successRate: 0
        });
        setLoading(false);
        setLoadingStats(false);
        return;
      }

      let fundedByOthers = 0;
      let fundedOthers = 0;
      let activeProjects = 0;
      let completedProjects = 0;
      let cancelledProjects = 0;
      let disputedProjects = 0;
      let totalFundingReceived = BigInt(0);
      let totalFundingGiven = BigInt(0);
      const userProjects: Project[] = [];

      for (let i = 0; i < projectIds.length; i++) {
        const projectId = projectIds[i];

        try {
          const projectData = await registry.getProject(projectId);
          const [
            projectIdNum,
            escrowAddress,
            funder,
            developer,
            title,
            description,
            tags,
            createdAt,
            updatedAt,
            active
          ] = projectData;

          const isFunder = funder.toLowerCase() === address.toLowerCase();
          const isDeveloper = developer.toLowerCase() === address.toLowerCase();
          
          if (isFunder) fundedOthers++;
          if (isDeveloper) fundedByOthers++;

          const project: Project = {
            projectId: Number(projectIdNum),
            escrowAddress,
            funder,
            developer,
            title: title || `Project ${projectId}`,
            description: description || '',
            tags: tags || [],
            createdAt: Number(createdAt),
            updatedAt: Number(updatedAt),
            active,
            userRole: isFunder ? 'funder' : 'developer'
          };

          try {
            const escrowInfo = await registry.getEscrowInfo(projectId);
            if (escrowInfo && escrowInfo.totalAmount) {
              project.totalAmount = ethers.formatEther(escrowInfo.totalAmount);
              
              if (isFunder) totalFundingGiven += escrowInfo.totalAmount;
              if (isDeveloper) totalFundingReceived += escrowInfo.totalAmount;
            }
          } catch (escrowErr) {
            console.warn(`Could not get escrow info for project ${projectId}:`, escrowErr);
          }

          try {
            const status = await registry.getProjectStatus(projectId);
            project.status = status;
            
            if (status.includes('Active') || status.includes('Funded')) {
              activeProjects++;
            } else if (status.includes('Completed')) {
              completedProjects++;
            } else if (status.includes('Cancelled')) {
              cancelledProjects++;
            } else if (status.includes('Disputed')) {
              disputedProjects++;
            }
          } catch (statusErr) {
            console.warn(`Could not get status for project ${projectId}:`, statusErr);
            if (project.active) activeProjects++;
          }

          userProjects.push(project);

        } catch (err) {
          console.error(`Error processing project ${projectId}:`, err);
        }
      }

      const sortedProjects = userProjects.sort((a, b) => b.createdAt - a.createdAt);
      setProjects(sortedProjects);

      const totalProjects = projectIds.length;
      const averageContractValue = totalProjects > 0 
        ? ethers.formatEther((totalFundingGiven + totalFundingReceived) / BigInt(totalProjects * 2))
        : '0';
      
      const successRate = totalProjects > 0 
        ? (completedProjects / totalProjects) * 100 
        : 0;

      const stats: FundingStats = {
        totalProjects,
        fundedByOthers,
        fundedOthers,
        activeProjects,
        completedProjects,
        cancelledProjects,
        disputedProjects,
        totalFundingReceived: ethers.formatEther(totalFundingReceived),
        totalFundingGiven: ethers.formatEther(totalFundingGiven),
        averageContractValue,
        successRate
      };

      setFundingStats(stats);

    } catch (err: any) {
      console.error('Error fetching user projects:', err);
      setError(err.message || 'Failed to load projects');
      
      if (err.message.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message.includes('contract')) {
        setError('Contract not found. Please check the contract address and network.');
      } else if (err.message.includes('call revert')) {
        setError('Contract call failed. The contract may not be deployed on this network.');
      }
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  }, [provider]);

  useEffect(() => {
    if (walletAddress && provider) {
      fetchUserProjects(walletAddress);
    } else {
      setProjects([]);
      setFundingStats(null);
    }
  }, [walletAddress, provider, fetchUserProjects]);

  const refetch = useCallback(async () => {
    if (walletAddress && provider) {
      await fetchUserProjects(walletAddress);
    }
  }, [walletAddress, provider, fetchUserProjects]);

  const handleProjectClick = useCallback((projectId: number) => {
    navigate(`/milestone/${projectId}`);
  }, [navigate]);

  return { 
    projects, 
    fundingStats,
    loading: loading || loadingStats,
    loadingProjects: loading,
    loadingStats,
    error, 
    refetch,
    handleProjectClick,
    signer,
    provider
  };
};

export const getProjectStatus = (status: string = '') => {
  switch (true) {
    case status.includes('Completed'):
      return { 
        text: 'Completed', 
        color: 'bg-green-900/30', 
        textColor: 'text-green-400',
        borderColor: 'border-green-800/50',
        icon: '✅'
      };
    case status.includes('Cancelled'):
      return { 
        text: 'Cancelled', 
        color: 'bg-red-900/30', 
        textColor: 'text-red-400',
        borderColor: 'border-red-800/50',
        icon: '❌'
      };
    case status.includes('Disputed'):
      return { 
        text: 'Disputed', 
        color: 'bg-yellow-900/30', 
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-800/50',
        icon: '⚖️'
      };
    case status.includes('Active'):
    case status.includes('Funded'):
      return { 
        text: 'Active', 
        color: 'bg-blue-900/30', 
        textColor: 'text-blue-400',
        borderColor: 'border-blue-800/50',
        icon: '💰'
      };
    default:
      return { 
        text: 'Inactive', 
        color: 'bg-gray-900/50', 
        textColor: 'text-gray-400',
        borderColor: 'border-gray-800/50',
        icon: '⏸️'
      };
  }
};

export const formatLargeNumber = (num: number | string): string => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '0';
  
  if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
  else if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  else if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  else if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
  else if (value < 0.001) return value.toExponential(2);
  else if (value < 1) return value.toPrecision(4);
  else return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
};

export const FundingStatsCard: React.FC<{ stats: FundingStats }> = ({ stats }) => {
  return (
    <div className="bg-black border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Escrow Funding Overview</h3>
        <div className="text-gray-400">
          Total Projects: <span className="font-bold text-purple-400">{stats.totalProjects}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-black border border-gray-800 p-4 rounded-xl">
          <div className="text-2xl font-bold text-purple-400 mb-1">{stats.fundedByOthers}</div>
          <div className="text-sm text-gray-400">Funded By Others</div>
        </div>
        
        <div className="bg-black border border-gray-800 p-4 rounded-xl">
          <div className="text-2xl font-bold text-blue-400 mb-1">{stats.fundedOthers}</div>
          <div className="text-sm text-gray-400">You Funded Others</div>
        </div>
        
        <div className="bg-black border border-gray-800 p-4 rounded-xl">
          <div className="text-2xl font-bold text-green-400 mb-1">{stats.activeProjects}</div>
          <div className="text-sm text-gray-400">Active Projects</div>
        </div>
        
        <div className="bg-black border border-gray-800 p-4 rounded-xl">
          <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.completedProjects}</div>
          <div className="text-sm text-gray-400">Completed</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-black border border-green-800/30 p-4 rounded-xl">
          <div className="text-lg font-bold text-green-400 mb-1">
            {formatLargeNumber(stats.totalFundingReceived)} ETH
          </div>
          <div className="text-sm text-gray-400">Total Received</div>
        </div>
        
        <div className="bg-black border border-blue-800/30 p-4 rounded-xl">
          <div className="text-lg font-bold text-blue-400 mb-1">
            {formatLargeNumber(stats.totalFundingGiven)} ETH
          </div>
          <div className="text-sm text-gray-400">Total Given</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-800">
        <div className="bg-black border border-gray-800 p-3 rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Success Rate</div>
          <div className="text-xl font-bold text-green-400">
            {stats.successRate.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-black border border-gray-800 p-3 rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Average Value</div>
          <div className="text-xl font-bold text-purple-400">
            {formatLargeNumber(stats.averageContractValue)} ETH
          </div>
        </div>
        
        <div className="bg-black border border-gray-800 p-3 rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Disputed/Cancelled</div>
          <div className="text-xl font-bold text-yellow-400">
            {stats.disputedProjects + stats.cancelledProjects}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectCard: React.FC<{ 
  project: Project; 
  onClick: (id: number) => void;
  showFunding?: boolean;
}> = ({ project, onClick, showFunding = true }) => {
  const status = getProjectStatus(project.status);
  const isFunder = project.userRole === 'funder';
  
  return (
    <div 
      onClick={() => onClick(project.projectId)}
      className="bg-black border border-gray-800 hover:border-purple-500/50 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/10 cursor-pointer group"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-lg font-semibold truncate group-hover:text-purple-300 transition-colors">
                {project.title}
              </h4>
              <span className="text-xs text-gray-500 font-mono">
                #{project.projectId}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-lg border ${isFunder ? 'bg-purple-900/30 text-purple-400 border-purple-800/50' : 'bg-blue-900/30 text-blue-400 border-blue-800/50'}`}>
                {isFunder ? 'Funder' : 'Developer'}
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-lg border ${status.color} ${status.textColor} ${status.borderColor}`}>
                {status.icon} {status.text}
              </span>
            </div>
          </div>
        </div>

        {project.description && (
          <div className="mb-4">
            <p className="text-gray-300 text-sm line-clamp-2 whitespace-pre-wrap">
              {project.description}
            </p>
          </div>
        )}

        {showFunding && project.totalAmount && parseFloat(project.totalAmount) > 0 && (
          <div className="mb-4">
            <div className="flex items-center text-purple-400">
              <span className="text-sm font-semibold">Total Value:</span>
              <span className="ml-2 font-bold">{formatLargeNumber(project.totalAmount)} ETH</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black border border-gray-800 p-2 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Funder</div>
              <div className="text-sm truncate font-mono text-gray-300">
                {project.funder === project.userRole ? 'You' : formatAddress(project.funder)}
              </div>
            </div>
            <div className="bg-black border border-gray-800 p-2 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Developer</div>
              <div className="text-sm truncate font-mono text-gray-300">
                {project.developer === project.userRole ? 'You' : formatAddress(project.developer)}
              </div>
            </div>
          </div>
        </div>

        {project.tags && project.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-black border border-gray-800 text-gray-400 text-xs rounded-lg"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="px-2 py-1 bg-black border border-gray-800 text-gray-500 text-xs rounded-lg">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <span className="mr-2">📅</span>
              <span>{new Date(project.createdAt * 1000).toLocaleDateString()}</span>
            </div>
            <div className="text-xs text-gray-400 group-hover:text-purple-400 transition-colors">
              View details →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};