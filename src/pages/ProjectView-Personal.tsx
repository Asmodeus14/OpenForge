/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import {
  ProjectRegistryABI,
  PROJECT_CONTRACT_ADDRESS,
  ProjectStatus
} from "../contracts/ProjectRegistryABI";

import type {
  ProjectMetadata,
  ProjectImage,
  ResolvedProject
} from "../Format/Metadata-Project";

import Sidebar from "../component/Sidebar";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

// Pinata IPFS Configuration
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || "";
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET || "";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Interface for project update form
interface UpdateProjectForm {
  title: string;
  description: string;
  tags: string[];
  images: ProjectImage[];
}

// Helper function to convert contract status to frontend status
const fromContractStatus = (status: number): ProjectStatus => {
  const statusNum = Number(status);
  
  if (statusNum === 0) return ProjectStatus.Draft;
  if (statusNum === 1) return ProjectStatus.Funding;
  if (statusNum === 2) return ProjectStatus.Completed;
  if (statusNum === 3) return ProjectStatus.Failed;
  
  return ProjectStatus.Draft;
};

const toContractStatus = (status: ProjectStatus): number => {
  if (status === ProjectStatus.Draft) return 0;
  if (status === ProjectStatus.Funding) return 1;
  if (status === ProjectStatus.Completed) return 2;
  if (status === ProjectStatus.Failed) return 3;
  
  return 0;
};

// Simple SHA-256 hash for mock CIDs
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function ProjectView_Personal() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [myProjects, setMyProjects] = useState<ResolvedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>("my-projects");
  const [updatingProjectId, setUpdatingProjectId] = useState<number | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdateProjectForm>({
    title: "",
    description: "",
    tags: [],
    images: []
  });
  const [newTag, setNewTag] = useState("");
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | null>(null);
  const [currentProjectStatus, setCurrentProjectStatus] = useState<ProjectStatus | null>(null);
  const [oldCID, setOldCID] = useState<string | null>(null);
  
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Responsive state for window size
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  
  // Navigation hook
  const navigate = useNavigate();

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ==================== WALLET ==================== */
  useEffect(() => {
    async function loadWallet() {
      if (!window.ethereum) {
        setError("Wallet not detected");
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWallet(address);
      } catch (err) {
        console.error("Failed to load wallet:", err);
        setError("Failed to connect wallet");
      }
    }

    loadWallet();
  }, []);

  /* ==================== FETCH MY PROJECTS ==================== */
  useEffect(() => {
    if (!wallet) return;
    fetchMyProjects(wallet);
  }, [wallet]);

  async function fetchMyProjects(currentWallet: string) {
    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const contract = new ethers.Contract(
        PROJECT_CONTRACT_ADDRESS,
        ProjectRegistryABI,
        provider
      );

      const totalProjects: bigint = await contract.nextProjectId();
      const myResolvedProjects: ResolvedProject[] = [];

      for (let i = 0; i < Number(totalProjects); i++) {
        try {
          const [builder, cid, contractStatus]: [string, string, any] =
            await contract.getProject(i);

          // Only show projects owned by the current user
          if (builder.toLowerCase() !== currentWallet.toLowerCase()) {
            continue;
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
                
          if (!cid || cid.trim() === "") {
            continue;
          }

          const metadata = await fetchProjectMetadata(cid);

          myResolvedProjects.push({
            projectId: i,
            builder,
            cid,
            status: frontendStatus,
            metadata,
            isOwner: true // Always true since we filtered by owner
          });
          
        } catch (err) {
          console.warn(`Skipping project ${i}:`, err);
        }
      }

      // Sort by project ID (newest first)
      myResolvedProjects.sort((a, b) => b.projectId - a.projectId);
      setMyProjects(myResolvedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError("Failed to load your projects");
    } finally {
      setLoading(false);
    }
  }

  /* ==================== IPFS ==================== */
  async function fetchProjectMetadata(cid: string): Promise<ProjectMetadata> {
    if (!cid || cid.trim() === "") {
      throw new Error("CID missing");
    }

    // Check if it's a mock CID
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

    return data as ProjectMetadata;
  }

  async function uploadMetadataToIPFS(metadata: ProjectMetadata): Promise<string> {
    setUploadingToIPFS(true);
    
    try {
      // Method 1: Try Pinata with API Key/Secret
      if (PINATA_API_KEY && PINATA_API_SECRET) {
        try {
          console.log("🔄 Attempting Pinata upload with API Key/Secret...");
          return await uploadToPinata(metadata);
        } catch (pinataError) {
          console.warn("⚠️ Pinata upload failed:", pinataError);
          // Fall through to mock upload
        }
      } else {
        console.log("📝 No Pinata credentials, using mock IPFS");
      }
      
      // Method 2: Use mock IPFS for development
      return await uploadToMockIPFS(metadata);
      
    } finally {
      setUploadingToIPFS(false);
    }
  }

  async function uploadToPinata(metadata: ProjectMetadata): Promise<string> {
    try {
      console.log("📤 Uploading to Pinata with API Key/Secret...");
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "pinata_api_key": PINATA_API_KEY,
          "pinata_secret_api_key": PINATA_API_SECRET
        },
        body: JSON.stringify({
          pinataMetadata: {
            name: `project-metadata-${Date.now()}`
          },
          pinataContent: metadata
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Pinata error response:", errorText);
        
        // Try to parse the error for better message
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(`Pinata upload failed: ${errorJson.error?.reason || errorText}`);
        } catch {
          throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log("✅ Pinata upload successful:", result.IpfsHash);
      return result.IpfsHash;
    } catch (error) {
      console.error("❌ Pinata upload error:", error);
      throw error;
    }
  }

  // Function to unpin old CID from Pinata
  async function unpinFromPinata(cid: string): Promise<void> {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      console.log("No Pinata credentials, skipping unpin");
      return;
    }

    // Skip if it's a mock CID
    if (cid.startsWith('mock-') || cid.startsWith('bafybeimock')) {
      console.log("Skipping unpin for mock CID:", cid);
      return;
    }

    try {
      console.log(`🗑️ Unpinning old CID: ${cid}`);
      const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
        method: "DELETE",
        headers: {
          "pinata_api_key": PINATA_API_KEY,
          "pinata_secret_api_key": PINATA_API_SECRET
        }
      });

      if (response.ok) {
        console.log(`✅ Successfully unpinned CID: ${cid}`);
      } else {
        console.warn(`⚠️ Failed to unpin CID ${cid}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Error unpinning from Pinata:", error);
    }
  }

  // Function to remove mock CID from localStorage
  async function removeMockCID(cid: string): Promise<void> {
    if (cid.startsWith('mock-') || cid.startsWith('bafybeimock') || cid.startsWith('bafybeig')) {
      console.log(`🗑️ Removing mock CID from localStorage: ${cid}`);
      const mockData = JSON.parse(localStorage.getItem('mock-ipfs') || '{}');
      delete mockData[cid];
      localStorage.setItem('mock-ipfs', JSON.stringify(mockData));
      console.log(`✅ Removed mock CID: ${cid}`);
    }
  }

  async function uploadToMockIPFS(metadata: ProjectMetadata): Promise<string> {
    console.log("📝 Using mock IPFS upload for development");
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate a deterministic mock CID based on content hash
    const contentString = JSON.stringify(metadata);
    const hash = await sha256(contentString);
    const mockCID = `bafybeimock${hash.substring(0, 10)}`;
    
    // Store in localStorage for persistence
    const mockData = JSON.parse(localStorage.getItem('mock-ipfs') || '{}');
    mockData[mockCID] = metadata;
    localStorage.setItem('mock-ipfs', JSON.stringify(mockData));
    
    console.log(`📦 Mock CID generated: ${mockCID}`);
    
    return mockCID;
  }

  /* ==================== UPDATE PROJECT FUNCTIONS ==================== */
  const openUpdateForm = (project: ResolvedProject) => {
    setUpdatingProjectId(project.projectId);
    setCurrentProjectStatus(project.status);
    setSelectedStatus(null);
    setUpdateForm({
      title: project.metadata.title,
      description: project.metadata.description,
      tags: [...project.metadata.tags],
      images: project.metadata.images || []
    });
    setOldCID(project.cid);
  };

  const closeUpdateForm = () => {
    setUpdatingProjectId(null);
    setCurrentProjectStatus(null);
    setSelectedStatus(null);
    setUpdateForm({
      title: "",
      description: "",
      tags: [],
      images: []
    });
    setNewTag("");
    setOldCID(null);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !updateForm.tags.includes(newTag.trim())) {
      setUpdateForm({
        ...updateForm,
        tags: [...updateForm.tags, newTag.trim()]
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setUpdateForm({
      ...updateForm,
      tags: updateForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleUpdateStatus = async (projectId: number) => {
    if (!wallet) {
      toast.error("Wallet not connected");
      return;
    }

    if (selectedStatus === null) {
      toast.error("Please select a new status");
      return;
    }

    if (selectedStatus === currentProjectStatus) {
      toast.error("Please select a different status from the current one");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PROJECT_CONTRACT_ADDRESS,
        ProjectRegistryABI,
        signer
      );

      toast.loading("Updating project status...", { id: "status-update" });
      
      const contractStatus = toContractStatus(selectedStatus);
      
      const tx = await contract.updateProjectStatus(projectId, contractStatus);
      await tx.wait();
      
      toast.success("Project status updated successfully!", { id: "status-update" });
      
      fetchMyProjects(wallet);
      closeUpdateForm();
    } catch (error: any) {
      console.error("Failed to update status:", error);
      
      let errorMessage = "Failed to update project status";
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: "status-update" });
    }
  };

  const handleUpdateMetadata = async (projectId: number) => {
    if (!wallet) {
      toast.error("Wallet not connected");
      return;
    }

    if (!updateForm.title.trim() || !updateForm.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    if (currentProjectStatus !== ProjectStatus.Draft) {
      toast.error("Metadata can only be updated while project is in Draft status");
      return;
    }

    // Get the current project to find old CID
    const currentProject = myProjects.find(p => p.projectId === projectId);
    if (!currentProject) {
      toast.error("Project not found");
      return;
    }

    const oldProjectCID = currentProject.cid;

    try {
      // Prepare updated metadata
      const updatedMetadata: ProjectMetadata = {
        type: "project",
        title: updateForm.title.trim(),
        description: updateForm.description.trim(),
        tags: updateForm.tags,
        images: updateForm.images,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Upload new metadata to IPFS
      const uploadToast = toast.loading("Uploading metadata to IPFS...", { id: "ipfs-upload" });
      const newCID = await uploadMetadataToIPFS(updatedMetadata);
      toast.dismiss(uploadToast);

      // Update contract with new CID
      const contractToast = toast.loading("Updating contract with new CID...", { id: "contract-update" });
      
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PROJECT_CONTRACT_ADDRESS,
        ProjectRegistryABI,
        signer
      );

      const tx = await contract.updateProjectMetadata(projectId, newCID);
      await tx.wait();
      
      toast.dismiss(contractToast);

      // Unpin/remove old CID after successful update
      if (oldProjectCID && oldProjectCID !== newCID) {
        toast.loading("Cleaning up old metadata...", { id: "cleanup" });
        
        try {
          if (PINATA_API_KEY && PINATA_API_SECRET && !oldProjectCID.startsWith('mock') && !oldProjectCID.startsWith('bafybeimock')) {
            // Unpin from Pinata
            await unpinFromPinata(oldProjectCID);
          } else if (oldProjectCID.startsWith('mock') || oldProjectCID.startsWith('bafybeimock') || oldProjectCID.startsWith('bafybeig')) {
            // Remove mock CID from localStorage
            await removeMockCID(oldProjectCID);
          }
          toast.dismiss("cleanup");
        } catch (cleanupError) {
          console.warn("Cleanup failed, but update was successful:", cleanupError);
          toast.dismiss("cleanup");
        }
      }

      toast.success("Project metadata updated successfully!", { 
        id: "final-success",
        duration: 3000 
      });
      
      // Refresh projects to show updated data
      await fetchMyProjects(wallet);
      closeUpdateForm();
      
    } catch (error: any) {
      console.error("Failed to update metadata:", error);
      
      toast.dismiss("ipfs-upload");
      toast.dismiss("contract-update");
      
      let errorMessage = "Failed to update project metadata";
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'CALL_EXCEPTION') {
        if (error.message?.includes("updateProjectMetadata")) {
          errorMessage = "Contract doesn't support metadata updates. Please deploy the updated contract.";
        }
      }
      
      toast.error(errorMessage, { 
        duration: 5000,
        id: "update-error"
      });
    }
  };

  const getAllowedNextStatuses = (currentStatus: ProjectStatus | null): ProjectStatus[] => {
    if (currentStatus === null) return [];
    
    switch (currentStatus) {
      case ProjectStatus.Draft:
        return [ProjectStatus.Funding];
      case ProjectStatus.Funding:
        return [ProjectStatus.Completed, ProjectStatus.Failed];
      case ProjectStatus.Completed:
        return [];
      case ProjectStatus.Failed:
        return [];
      default:
        return [];
    }
  };

  /* ==================== HELPER FUNCTIONS ==================== */
  function statusLabel(status: ProjectStatus) {
    switch (status) {
      case ProjectStatus.Draft:
        return "Draft";
      case ProjectStatus.Funding:
        return "Funding";
      case ProjectStatus.Completed:
        return "Completed";
      case ProjectStatus.Failed:
        return "Failed";
      default:
        return "Unknown";
    }
  }

  function getStatusColor(status: ProjectStatus) {
    switch (status) {
      case ProjectStatus.Completed:
        return "bg-emerald-900/30 text-emerald-300 border-emerald-800/50";
      case ProjectStatus.Funding:
        return "bg-purple-900/30 text-purple-300 border-purple-800/50";
      case ProjectStatus.Draft:
        return "bg-gray-900/50 text-gray-300 border-gray-800/50";
      case ProjectStatus.Failed:
        return "bg-rose-900/30 text-rose-300 border-rose-800/50";
      default:
        return "bg-gray-900/50 text-gray-300 border-gray-800/50";
    }
  }

  function extractImages(images?: ProjectImage[]) {
    const cover = images?.find(img => img.type === "cover");
    const gallery = images?.filter(img => img.type === "gallery") || [];
    return { cover, gallery };
  }

  const canUpdateMetadata = (project: ResolvedProject): boolean => {
    return project.isOwner && project.status === ProjectStatus.Draft;
  };

  // Handle Create Project button click
  const handleCreateProject = () => {
    navigate("/create");
  };

  /* ==================== UI ==================== */
  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-gray-900 border border-gray-800 shadow-2xl',
          style: {
            background: '#0a0a0a',
            color: '#f3f4f6',
            border: '1px solid #1f2937',
          },
        }}
      />
      
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showCreateButton={true}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header - Responsive layout */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent text-center sm:text-left">
                My Projects
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-2 text-center sm:text-left">
                Manage and track all your creative projects
              </p>
            </div>
            {wallet && (
              <button
                onClick={handleCreateProject}
                className="px-5 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-xl hover:from-purple-700 hover:to-purple-900 shadow-lg hover:shadow-2xl transition-all duration-200 text-sm sm:text-base font-medium border border-purple-900/50 hover:border-purple-700/50 active:scale-95"
              >
                + Create New Project
              </button>
            )}
          </div>
          
          {myProjects.length > 0 && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-gray-300">Completed</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500"></div>
                <span className="text-gray-300">Funding</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gray-500"></div>
                <span className="text-gray-300">Draft</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500"></div>
                <span className="text-gray-300">Failed</span>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-purple-600"></div>
              <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-purple-400 opacity-50" style={{ animationDirection: 'reverse' }}></div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 sm:p-6 mb-6 sm:mb-8 bg-rose-900/20 border border-rose-800/50 rounded-xl backdrop-blur-sm">
            <p className="text-rose-300 font-medium text-sm sm:text-base flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {!loading && !wallet && (
          <div className="text-center py-16 sm:py-24">
            <div className="text-5xl sm:text-6xl mb-6 opacity-80">🔐</div>
            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-100 mb-3">Connect Your Wallet</h3>
            <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-md mx-auto">
              Connect your wallet to view and manage your projects on the blockchain
            </p>
            <div className="inline-block p-0.5 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl">
              <div className="px-8 py-4 bg-gray-900 rounded-xl">
                <span className="text-gray-300">Wallet not detected</span>
              </div>
            </div>
          </div>
        )}

        {!loading && wallet && myProjects.length === 0 && (
          <div className="text-center py-16 sm:py-24">
            <div className="text-6xl sm:text-7xl mb-8 opacity-80">🚀</div>
            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-100 mb-4">No Projects Yet</h3>
            <p className="text-gray-400 text-base sm:text-lg mb-10 max-w-lg mx-auto">
              Launch your first project and start your creative journey on the blockchain
            </p>
            <button
              onClick={handleCreateProject}
              className="px-8 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-medium rounded-xl hover:from-purple-700 hover:to-purple-900 shadow-xl hover:shadow-2xl transition-all duration-200 text-base sm:text-lg border border-purple-900/50 hover:border-purple-700/50 active:scale-95"
            >
              Create Your First Project
            </button>
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800 backdrop-blur-sm hover:border-purple-800/50 transition-colors">
                <div className="text-3xl mb-4 text-purple-400">📝</div>
                <h4 className="font-semibold text-gray-100 mb-2">Create Draft</h4>
                <p className="text-sm text-gray-400">Start with a draft and add all project details</p>
              </div>
              <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800 backdrop-blur-sm hover:border-purple-800/50 transition-colors">
                <div className="text-3xl mb-4 text-purple-400">💰</div>
                <h4 className="font-semibold text-gray-100 mb-2">Launch Funding</h4>
                <p className="text-sm text-gray-400">Move to funding stage when you're ready</p>
              </div>
              <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800 backdrop-blur-sm hover:border-purple-800/50 transition-colors">
                <div className="text-3xl mb-4 text-purple-400">✅</div>
                <h4 className="font-semibold text-gray-100 mb-2">Mark Complete</h4>
                <p className="text-sm text-gray-400">Update status as you complete milestones</p>
              </div>
            </div>
          </div>
        )}

        {/* My Projects List - Responsive grid */}
        <div className="space-y-6 sm:space-y-8">
          {myProjects.map(project => {
            const { cover, gallery } = extractImages(project.metadata.images);
            const allowedNextStatuses = getAllowedNextStatuses(project.status);
            const canUpdateMeta = canUpdateMetadata(project);

            return (
              <div
                key={project.projectId}
                className="bg-gray-900/30 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-800 hover:border-gray-700/50 transition-all duration-500 overflow-hidden backdrop-blur-sm group hover:shadow-2xl"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left Side - Cover Image */}
                  <div className="w-full md:w-2/5 lg:w-1/3 bg-gray-950 relative overflow-hidden">
                    <div className="relative h-52 sm:h-60 md:h-full min-h-[240px]">
                      {cover ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                          <img
                            src={`${IPFS_GATEWAY}${cover.cid}`}
                            alt={`${project.metadata.title} cover`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 to-black">
                          <div className="text-center p-8">
                            <div className="text-4xl mb-4 opacity-50">🖼️</div>
                            <span className="text-gray-500 text-base">No Cover Image</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Status Badge on Image */}
                      <div className="absolute top-4 left-4 z-20">
                        <span className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium border backdrop-blur-md ${getStatusColor(project.status)}`}>
                          {statusLabel(project.status)}
                        </span>
                      </div>
                      
                      {/* Owner Badge */}
                      <div className="absolute top-4 right-4 z-20">
                        <span className="px-4 py-2 bg-gradient-to-r from-purple-900/80 to-purple-800/80 text-purple-100 text-xs sm:text-sm font-medium rounded-full border border-purple-700/50 backdrop-blur-md">
                          Your Project
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Content */}
                  <div className="w-full md:w-3/5 lg:w-2/3 p-6 sm:p-8 lg:p-10">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 truncate">
                            {project.metadata.title}
                          </h2>
                          <button
                            onClick={() => openUpdateForm(project)}
                            className="text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0 mt-1"
                            title="Edit Project"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-400 mb-6">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">Project ID:</span>
                            <span className="px-3 py-1.5 bg-gray-800/50 rounded-lg font-mono border border-gray-700">#{project.projectId}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">CID:</span>
                            <span className="px-3 py-1.5 bg-gray-800/50 rounded-lg font-mono border border-gray-700 truncate max-w-[120px] sm:max-w-[200px]">
                              {project.cid.slice(0, 16)}...
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Created: {new Date(project.metadata.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => openUpdateForm(project)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-medium rounded-xl hover:from-purple-700 hover:to-purple-900 shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base border border-purple-900/50 hover:border-purple-700/50 active:scale-95"
                      >
                        Update Project
                      </button>
                    </div>

                    {/* Description - Truncated on mobile */}
                    <p className="text-gray-300 mb-8 leading-relaxed text-base line-clamp-3 sm:line-clamp-4">
                      {project.metadata.description}
                    </p>

                    {/* Tags */}
                    <div className="mb-8">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.metadata.tags.slice(0, windowWidth < 640 ? 3 : undefined).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-gradient-to-r from-purple-900/30 to-purple-800/20 text-purple-300 text-sm font-medium rounded-lg border border-purple-800/30"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.metadata.tags.length === 0 && (
                          <span className="text-gray-500 text-sm">No tags added</span>
                        )}
                        {windowWidth < 640 && project.metadata.tags.length > 3 && (
                          <span className="px-4 py-2 text-gray-500 text-sm">
                            +{project.metadata.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 border-t border-gray-800/50">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Last Updated: {new Date(project.metadata.updatedAt).toLocaleDateString()}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                          {canUpdateMeta && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-emerald-300 font-medium text-sm">
                                Draft - Editable
                              </span>
                            </div>
                          )}
                          {allowedNextStatuses.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <span className="text-sm text-gray-400">Next Status:</span>
                              <div className="flex flex-wrap gap-2">
                                {allowedNextStatuses.slice(0, windowWidth < 640 ? 2 : undefined).map(status => (
                                  <span
                                    key={status}
                                    className="text-xs px-3 py-1.5 bg-gray-800/50 text-gray-300 rounded-lg border border-gray-700"
                                  >
                                    {statusLabel(status)}
                                  </span>
                                ))}
                                {windowWidth < 640 && allowedNextStatuses.length > 2 && (
                                  <span className="text-xs px-3 py-1.5 text-gray-500">
                                    +{allowedNextStatuses.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Update Project Modal - Responsive */}
        {updatingProjectId !== null && currentProjectStatus !== null && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 max-w-full sm:max-w-2xl lg:max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-800 my-4">
              <div className="flex justify-between items-center mb-6 sm:mb-8 lg:mb-10">
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent truncate">
                    Update Project #{updatingProjectId}
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                    <p className="text-gray-400 text-sm sm:text-base">
                      Current Status: <span className={`font-medium ${getStatusColor(currentProjectStatus).split(' ')[1]}`}>
                        {statusLabel(currentProjectStatus)}
                      </span>
                    </p>
                    {oldCID && (
                      <p className="text-xs text-gray-500 truncate">
                        Old CID: {oldCID.slice(0, 24)}...
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeUpdateForm}
                  className="text-gray-500 hover:text-gray-300 text-3xl sm:text-4xl ml-2 transition-colors hover:scale-110"
                >
                  &times;
                </button>
              </div>

              {/* Status Update Section */}
              <div className="mb-8 sm:mb-10 lg:mb-12 p-6 sm:p-8 bg-gray-800/30 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-4 sm:mb-6 flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Update Status
                </h3>
                
                {getAllowedNextStatuses(currentProjectStatus).length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-gray-400 text-base sm:text-lg">No further status updates allowed for this project.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-400 mb-6 text-base">Select a new status for your project:</p>
                    <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
                      {getAllowedNextStatuses(currentProjectStatus).map(status => (
                        <button
                          key={status}
                          onClick={() => setSelectedStatus(status)}
                          className={`px-5 py-3 sm:px-6 sm:py-4 rounded-xl font-medium transition-all duration-200 text-base ${
                            selectedStatus === status
                              ? "bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-xl border border-purple-700/50"
                              : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700"
                          }`}
                        >
                          {statusLabel(status)}
                        </button>
                      ))}
                    </div>
                    
                    {selectedStatus !== null && (
                      <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                        <p className="text-sm text-gray-300">
                          <span className="font-medium text-gray-100">Status Change:</span> {statusLabel(currentProjectStatus)} → {statusLabel(selectedStatus)}
                        </p>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleUpdateStatus(updatingProjectId)}
                      disabled={selectedStatus === null || selectedStatus === currentProjectStatus}
                      className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-medium rounded-xl hover:from-purple-700 hover:to-purple-900 shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base border border-purple-900/50 hover:border-purple-700/50 active:scale-95"
                    >
                      {selectedStatus === null
                        ? "Select a status to update"
                        : selectedStatus === currentProjectStatus
                        ? "Select a different status"
                        : "Update Status"}
                    </button>
                  </>
                )}
              </div>

              {/* Metadata Update Section */}
              <div className="mb-8">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-6 flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Update Project Details
                </h3>
                
                {currentProjectStatus !== ProjectStatus.Draft ? (
                  <div className="mb-6 p-4 bg-amber-900/20 border border-amber-800/30 rounded-xl">
                    <p className="text-amber-300 text-sm flex items-start gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span><strong>Note:</strong> Metadata can only be updated while the project is in "Draft" status. Current status is "{statusLabel(currentProjectStatus)}".</span>
                    </p>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-xl">
                    <p className="text-emerald-300 text-sm flex items-start gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span><strong>Good news!</strong> Your project is in "Draft" status, so you can update the metadata. {oldCID && "Old CID will be automatically cleaned up after update."}</span>
                    </p>
                  </div>
                )}
                
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      value={updateForm.title}
                      onChange={(e) => setUpdateForm({...updateForm, title: e.target.value})}
                      className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all text-base text-gray-100 placeholder-gray-500"
                      placeholder="Enter project title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Description *
                    </label>
                    <textarea
                      value={updateForm.description}
                      onChange={(e) => setUpdateForm({...updateForm, description: e.target.value})}
                      className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all h-40 sm:h-48 text-base text-gray-100 placeholder-gray-500"
                      placeholder="Describe your project..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Tags
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Add a new tag"
                        className="flex-1 p-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all text-base text-gray-100 placeholder-gray-500"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-xl hover:from-purple-700 hover:to-purple-900 transition-all duration-200 text-base font-medium border border-purple-900/50 hover:border-purple-700/50 active:scale-95"
                      >
                        Add Tag
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {updateForm.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-900/40 to-purple-800/20 text-purple-300 rounded-lg text-sm font-medium border border-purple-800/30"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="text-purple-400 hover:text-purple-200 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                      {updateForm.tags.length === 0 && (
                        <span className="text-gray-500 text-sm">No tags added yet</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-6 mt-10 pt-8 border-t border-gray-800/50">
                  <button
                    onClick={closeUpdateForm}
                    className="px-8 py-4 border border-gray-700 text-gray-300 font-medium rounded-xl hover:bg-gray-800/50 transition-all duration-200 text-base order-2 sm:order-1 hover:border-gray-600 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateMetadata(updatingProjectId)}
                    disabled={uploadingToIPFS || currentProjectStatus !== ProjectStatus.Draft}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-emerald-900 shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base border border-emerald-900/50 hover:border-emerald-700/50 active:scale-95 order-1 sm:order-2"
                  >
                    {uploadingToIPFS ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Uploading to IPFS...
                      </span>
                    ) : currentProjectStatus !== ProjectStatus.Draft ? (
                      "Change to Draft to Update Metadata"
                    ) : (
                      "Save Changes & Cleanup Old CID"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}