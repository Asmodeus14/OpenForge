// src/components/UserProjectsSection.tsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  ProjectRegistryABI,
  PROJECT_CONTRACT_ADDRESS,
  ProjectStatus
} from '../contracts/ProjectRegistryABI';
import type { ResolvedProject } from '../Format/Metadata-Project';

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

interface Props {
  address: string;
}

const fromContractStatus = (status: number): ProjectStatus => {
  const statusNum = Number(status);
  
  if (statusNum === 0) return ProjectStatus.Draft;
  if (statusNum === 1) return ProjectStatus.Funding;
  if (statusNum === 2) return ProjectStatus.Completed;
  if (statusNum === 3) return ProjectStatus.Failed;
  
  return ProjectStatus.Draft;
};

async function fetchProjectMetadata(cid: string): Promise<any> {
  if (!cid || cid.trim() === "") {
    throw new Error("CID missing");
  }

  if (cid.startsWith('mock-') || cid.startsWith('bafybeimock') || cid.startsWith('bafybeig')) {
    const mockData = JSON.parse(localStorage.getItem('mock-ipfs') || '{}');
    if (mockData[cid]) {
      return mockData[cid];
    }
    throw new Error("Mock metadata not found");
  }

  const cleanCID = cid.replace('ipfs://', '').replace(/^\/+|\/+$/g, '');
  
  const res = await fetch(`${IPFS_GATEWAY}${cleanCID}`, {
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch metadata from IPFS");
  }

  const data = await res.json();

  if (data.type !== "project") {
    throw new Error("Invalid project metadata");
  }

  return data;
}

function statusLabel(status: ProjectStatus) {
  switch (status) {
    case ProjectStatus.Draft: return "Draft";
    case ProjectStatus.Funding: return "Funding";
    case ProjectStatus.Completed: return "Completed";
    case ProjectStatus.Failed: return "Failed";
    default: return "Unknown";
  }
}

function getStatusColor(status: ProjectStatus) {
  switch (status) {
    case ProjectStatus.Completed:
      return "bg-green-900/30 text-green-400 border-green-800/50";
    case ProjectStatus.Funding:
      return "bg-purple-900/30 text-purple-400 border-purple-800/50";
    case ProjectStatus.Draft:
      return "bg-gray-900/50 text-gray-400 border-gray-800/50";
    case ProjectStatus.Failed:
      return "bg-red-900/30 text-red-400 border-red-800/50";
    default:
      return "bg-gray-900/50 text-gray-400 border-gray-800/50";
  }
}

const UserProjectsSection: React.FC<Props> = ({ address }) => {
  const [projects, setProjects] = useState<ResolvedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProjects, setTotalProjects] = useState(0);

  async function fetchUserProjects(userAddress: string) {
    setLoading(true);
    setError(null);

    try {
      let provider;
      if (typeof window !== 'undefined' && window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        const publicRpcUrl = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
        provider = new ethers.JsonRpcProvider(publicRpcUrl);
      }

      const contract = new ethers.Contract(
        PROJECT_CONTRACT_ADDRESS,
        ProjectRegistryABI,
        provider
      );

      const totalProjectsBigInt: bigint = await contract.nextProjectId();
      const total = Number(totalProjectsBigInt);
      setTotalProjects(total);

      const userResolvedProjects: ResolvedProject[] = [];

      const batchSize = 10;
      for (let i = 0; i < total; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, total);
        const batchPromises = [];
        
        for (let j = i; j < batchEnd; j++) {
          batchPromises.push((async () => {
            try {
              const [builder, cid, contractStatus]: [string, string, any] =
                await contract.getProject(j);

              if (builder.toLowerCase() !== userAddress.toLowerCase()) {
                return null;
              }

              if (!cid || cid.trim() === "") {
                return null;
              }

              let statusNum: number;
              if (typeof contractStatus === 'bigint') {
                statusNum = Number(contractStatus);
              } else if (typeof contractStatus === 'number') {
                statusNum = contractStatus;
              } else {
                statusNum = Number(contractStatus);
              }
              const frontendStatus = fromContractStatus(statusNum);

              const metadata = await fetchProjectMetadata(cid);

              return {
                projectId: j,
                builder,
                cid,
                status: frontendStatus,
                metadata,
                isOwner: true
              } as ResolvedProject;
              
            } catch (err) {
              console.warn(`Skipping project ${j}:`, err);
              return null;
            }
          })());
        }

        const batchResults = await Promise.all(batchPromises);
        const validProjects = batchResults.filter(p => p !== null) as ResolvedProject[];
        userResolvedProjects.push(...validProjects);
      }

      userResolvedProjects.sort((a, b) => b.projectId - a.projectId);
      setProjects(userResolvedProjects);
      
    } catch (err: any) {
      console.error('Error fetching user projects:', err);
      setError("Failed to load user projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (address) {
      fetchUserProjects(address);
    }
  }, [address]);

  const handleViewProject = (projectId: number) => {
    window.open(`/project/${projectId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-purple-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-400">Loading regular projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black border border-red-800/30 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-800 rounded-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black border border-gray-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-gray-300 mb-2">No regular projects found for this address.</p>
        <p className="text-gray-500 text-sm">
          This user hasn't created any projects in the Project Registry yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Regular Projects ({projects.length})</h3>
        <p className="text-gray-400">
          Scanned {projects.length}/{totalProjects} projects
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const { metadata } = project;
          const coverImage = metadata.images?.find(img => img.type === "cover");

          return (
            <div
              key={project.projectId}
              className="bg-black border border-gray-800 hover:border-purple-500/50 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/10 cursor-pointer group"
              onClick={() => handleViewProject(project.projectId)}
            >
              <div className="h-48 overflow-hidden relative bg-gradient-to-br from-gray-900/50 to-black">
                {coverImage ? (
                  <img
                    src={`${IPFS_GATEWAY}${coverImage.cid.replace('ipfs://', '')}`}
                    alt={metadata.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`image-fallback ${coverImage ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                  <div className="text-4xl text-gray-700">
                    {project.status === ProjectStatus.Completed ? '✅' : 
                     project.status === ProjectStatus.Funding ? '💰' : 
                     project.status === ProjectStatus.Draft ? '📝' : '❌'}
                  </div>
                </div>
                
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-sm ${getStatusColor(project.status)}`}>
                    {statusLabel(project.status)}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold truncate flex-1 mr-2 group-hover:text-purple-300 transition-colors">
                    {metadata.title}
                  </h4>
                  <span className="text-xs text-gray-500 font-mono flex-shrink-0">
                    #{project.projectId}
                  </span>
                </div>

                {metadata.description && (
                  <div className="mb-4">
                    <p className="text-gray-300 text-sm line-clamp-2 whitespace-pre-wrap">
                      {metadata.description.length > 120 
                        ? `${metadata.description.substring(0, 120)}...`
                        : metadata.description}
                    </p>
                  </div>
                )}

                {metadata.tags && metadata.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {metadata.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-black border border-gray-800 text-gray-400 text-xs rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                      {metadata.tags.length > 3 && (
                        <span className="px-2 py-1 bg-black border border-gray-800 text-gray-500 text-xs rounded-lg">
                          +{metadata.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <span className="mr-2">📅</span>
                      <span>{new Date(metadata.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-gray-400 group-hover:text-purple-400 transition-colors">
                      View details →
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserProjectsSection;