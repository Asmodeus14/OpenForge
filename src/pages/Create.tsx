import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast, Toaster } from "react-hot-toast";

import {
  ProjectRegistryABI,
  PROJECT_CONTRACT_ADDRESS
} from "../contracts/ProjectRegistryABI";

import type { ProjectMetadata } from "../Format/uploadMetadata-Project";
import { validateProjectMetadata } from "../IPFS/CheckUploadProjectMetaData";
import { uploadJSONToPinata, uploadFileToPinata } from "../utils/pinata";
import Sidebar from "../component/Sidebar";

// Modern icons using Heroicons
const Icons = {
  Sparkles: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  XMark: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Photo: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Lightning: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  InformationCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  CurrencyDollar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Tag: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  )
};

export default function CreateProject() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("create");
  const [wallet, setWallet] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  /* ==================== WALLET ==================== */
  useEffect(() => {
    async function loadWallet() {
      if (!window.ethereum) {
        toast.error("Wallet not detected");
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWallet(address);
      } catch (err) {
        console.error("Failed to load wallet:", err);
        toast.error("Failed to connect wallet");
      }
    }

    loadWallet();
  }, []);

  /* ==================== IMAGE VALIDATION ==================== */
  const validateImageFile = async (file: File): Promise<void> => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Only JPG, PNG, WebP, and GIF images are allowed');
    }

    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Image size (${sizeInMB}MB) exceeds 1MB limit`);
    }

    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 4000;
        const maxHeight = 4000;
        
        if (img.width > maxWidth || img.height > maxHeight) {
          reject(new Error(`Image dimensions (${img.width}x${img.height}) exceed maximum ${maxWidth}x${maxHeight}`));
          return;
        }

        const minAspectRatio = 0.5;
        const maxAspectRatio = 2;
        const aspectRatio = img.width / img.height;
        
        if (aspectRatio < minAspectRatio || aspectRatio > maxAspectRatio) {
          reject(new Error(`Image aspect ratio should be between 1:2 and 2:1`));
          return;
        }
        
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for validation'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  /* ==================== IMAGE HANDLING ==================== */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) {
      setImage(null);
      setImagePreview(null);
      return;
    }

    try {
      await validateImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setImage(file);
      
      const sizeInKB = Math.round(file.size / 1024);
      toast.success(`Image selected (${sizeInKB} KB)`, {
        icon: '🖼️',
        duration: 3000
      });
      
    } catch (error: any) {
      console.error('Image validation error:', error);
      
      e.target.value = '';
      setImage(null);
      setImagePreview(null);
      
      toast.error(error.message || 'Invalid image file', {
        duration: 5000
      });
    }
  };

  /* ==================== TAG HANDLING ==================== */
  const handleAddTag = () => {
    const trimmedTag = tags.trim();
    if (trimmedTag && !tagList.includes(trimmedTag)) {
      if (trimmedTag.length > 30) {
        toast.error(`Tag must be less than 30 characters`);
        return;
      }
      if (/[<>{}[\]\\]/.test(trimmedTag)) {
        toast.error(`Tag contains invalid characters`);
        return;
      }
      if (tagList.length >= 10) {
        toast.error("Maximum 10 tags allowed");
        return;
      }
      
      setTagList([...tagList, trimmedTag]);
      setTags("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagList(tagList.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  /* ==================== CREATE PROJECT ==================== */
  async function createProject() {
    if (!wallet) {
      toast.error("Please connect your wallet first");
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Please enter a project title");
      return;
    }
    if (trimmedTitle.length < 3) {
      toast.error("Title must be at least 3 characters long");
      return;
    }
    if (trimmedTitle.length > 100) {
      toast.error("Title must be less than 100 characters");
      return;
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      toast.error("Please enter a project description");
      return;
    }
    if (trimmedDescription.length < 10) {
      toast.error("Description must be at least 10 characters long");
      return;
    }
    if (trimmedDescription.length > 1000) {
      toast.error("Description must be less than 1000 characters");
      return;
    }

    const finalTags = tagList.length > 0 ? tagList : tags.split(",").map(t => t.trim()).filter(t => t);
    
    if (finalTags.length === 0) {
      toast.error("At least one tag is required");
      return;
    }
    if (finalTags.length > 10) {
      toast.error("Maximum 10 tags allowed");
      return;
    }

    for (const tag of finalTags) {
      if (tag.length > 30) {
        toast.error(`Tag "${tag}" must be less than 30 characters`);
        return;
      }
      if (/[<>{}[\]\\]/.test(tag)) {
        toast.error(`Tag "${tag}" contains invalid characters`);
        return;
      }
    }

    if (image) {
      const maxSize = 1 * 1024 * 1024;
      if (image.size > maxSize) {
        const sizeInMB = (image.size / (1024 * 1024)).toFixed(2);
        toast.error(`Image size (${sizeInMB}MB) exceeds 1MB limit`);
        return;
      }
    }

    try {
      setLoading(true);
      setStep(1);
      toast.loading("Starting project creation...", { id: "create-project" });

      let images = undefined;

      if (image) {
        setStep(2);
        toast.loading("Uploading cover image to IPFS...", { id: "image-upload" });
        const imageCID = await uploadFileToPinata(image);
        images = [{ cid: imageCID, type: "cover" as const }];
        toast.success("Image uploaded successfully!", { id: "image-upload" });
      }

      setStep(3);
      const metadata: ProjectMetadata = {
        type: "project",
        version: "1.0",
        title: trimmedTitle,
        description: trimmedDescription,
        tags: finalTags,
        images,
        createdAt: Date.now()
      };

      validateProjectMetadata(metadata);

      toast.loading("Uploading project metadata to IPFS...", { id: "metadata-upload" });
      const metadataCID = await uploadJSONToPinata(metadata);
      toast.success("Metadata uploaded successfully!", { id: "metadata-upload" });

      setStep(4);
      toast.loading("Sending transaction to blockchain...", { id: "transaction" });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        PROJECT_CONTRACT_ADDRESS,
        ProjectRegistryABI,
        signer
      );

      const tx = await contract.registerProject(metadataCID);
      setStatus("Waiting for transaction confirmation...");

      contract.once("ProjectRegistered", (projectId, builder, cid) => {
        console.log(`Project #${projectId.toString()} created by ${builder}`);
        setStatus(`✅ Project #${projectId.toString()} created successfully!`);
      });

      await tx.wait();
      
      setStep(5);
      toast.success("Project created successfully!", { id: "transaction" });
      toast.dismiss("create-project");

      setTitle("");
      setDescription("");
      setTags("");
      setTagList([]);
      setImage(null);
      setImagePreview(null);
      setStatus("Project created! You can now view it in the projects list.");

      toast.success("🎉 Project created successfully! Redirecting...", { 
        duration: 5000,
        icon: '🚀'
      });

      setTimeout(() => {
        window.location.href = "/projects";
      }, 3000);

    } catch (err: any) {
      console.error(err);
      
      toast.dismiss("create-project");
      toast.dismiss("image-upload");
      toast.dismiss("metadata-upload");
      toast.dismiss("transaction");

      let errorMessage = "Failed to create project";
      if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setStatus(`❌ ${errorMessage}`);
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  /* ==================== UI ==================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-gray-100">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: '!bg-gray-900/95 !backdrop-blur-xl !border !border-gray-800/50 !shadow-2xl',
          style: {
            background: 'rgba(17, 24, 39, 0.95)',
            color: '#f3f4f6',
            border: '1px solid rgba(55, 65, 81, 0.5)',
            backdropFilter: 'blur(12px)',
          },
        }}
      />

      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showCreateButton={false}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Modern Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                  <Icons.Sparkles />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Create New Project
                </h1>
              </div>
              <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
                Launch your decentralized project with secure blockchain storage and IPFS-powered metadata
              </p>
            </div>
            
            {wallet && (
              <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-gray-900/80 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-xl">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"></div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Connected Wallet</p>
                  <p className="text-sm font-medium bg-gradient-to-r from-gray-200 to-gray-300 bg-clip-text text-transparent">
                    {wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-transparent -translate-y-1/2 z-0"></div>
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div key={stepNum} className="relative z-10">
                  <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300
                    ${step === stepNum 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-transparent scale-110 shadow-lg shadow-purple-500/25'
                      : step > stepNum
                      ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/30'
                      : 'bg-gray-900/50 border-gray-800 backdrop-blur-sm'
                    }
                  `}>
                    {step > stepNum ? (
                      <Icons.Check />
                    ) : (
                      <span className={`font-semibold ${step === stepNum ? 'text-white' : 'text-gray-500'}`}>
                        {stepNum}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap text-sm">
                    <span className={step >= stepNum ? 'text-gray-300' : 'text-gray-600'}>
                      {['Setup', 'Upload', 'Metadata', 'Blockchain', 'Complete'][stepNum - 1]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-800/50 shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="space-y-10">
                  {/* Project Title */}
                  <div className="group">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-300 bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                        Project Title <span className="text-purple-400">*</span>
                      </label>
                      <span className="text-xs text-gray-500">{title.length}/100</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Enter a descriptive title for your project"
                        className="w-full p-5 bg-black/30 backdrop-blur-sm border-2 border-gray-800/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all duration-300 text-lg text-white placeholder-gray-600 hover:border-gray-700/50 group-hover:border-gray-700/50"
                        disabled={loading}
                        maxLength={100}
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 ml-1">This will be the main identifier for your project (3-100 characters)</p>
                  </div>

                  {/* Project Description */}
                  <div className="group">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-300 bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                        Description <span className="text-purple-400">*</span>
                      </label>
                      <span className="text-xs text-gray-500">{description.length}/1000</span>
                    </div>
                    <div className="relative">
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Describe your project in detail. What are your goals, timeline, and vision?"
                        className="w-full p-5 bg-black/30 backdrop-blur-sm border-2 border-gray-800/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all duration-300 text-base text-white placeholder-gray-600 hover:border-gray-700/50 resize-y min-h-[160px]"
                        disabled={loading}
                        maxLength={1000}
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 ml-1">Be clear and detailed to attract supporters (10-1000 characters)</p>
                  </div>

                  {/* Tags */}
                  <div className="group">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-300 bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                        Tags <span className="text-purple-400">*</span>
                      </label>
                      <span className="text-xs text-gray-500">{tagList.length}/10 tags</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={tags}
                          onChange={e => setTags(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Add tags (press Enter to add)"
                          className="w-full p-5 bg-black/30 backdrop-blur-sm border-2 border-gray-800/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all duration-300 text-base text-white placeholder-gray-600 hover:border-gray-700/50 pl-12"
                          disabled={loading}
                          maxLength={30}
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <Icons.Tag />
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                      <button
                        onClick={handleAddTag}
                        disabled={loading || !tags.trim()}
                        className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none py-5 whitespace-nowrap font-medium shadow-lg shadow-purple-500/25 flex items-center gap-2 justify-center group/button"
                      >
                        <Icons.Plus />
                        <span>Add Tag</span>
                      </button>
                    </div>
                    
                    {/* Tag Display */}
                    <div className="flex flex-wrap gap-3 min-h-14 p-4 bg-black/20 backdrop-blur-sm rounded-2xl border border-gray-800/30">
                      {tagList.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-800/30 text-purple-300 rounded-xl text-sm font-medium backdrop-blur-sm hover:border-purple-700/50 transition-colors group/tag"
                        >
                          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {tag}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            disabled={loading}
                            className="text-purple-400/60 hover:text-white transition-colors hover:scale-110"
                          >
                            <Icons.XMark />
                          </button>
                        </span>
                      ))}
                      {tagList.length === 0 && (
                        <span className="text-gray-600 text-sm italic">No tags added yet</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500 ml-1">Tags help categorize your project (1-10 tags, max 30 characters each)</p>
                  </div>

                  {/* Cover Image Upload */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-300 bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent mb-3">
                      Cover Image <span className="text-gray-500">(Optional - Max 1MB)</span>
                    </label>
                    
                    {/* Image Preview */}
                    {imagePreview ? (
                      <div className="relative w-full h-72 rounded-2xl overflow-hidden border-2 border-gray-800/50 group-hover:border-gray-700/50 transition-all">
                        <img
                          src={imagePreview}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                <Icons.Photo />
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  Size: {image ? Math.round(image.size / 1024) : 0} KB
                                </p>
                                <p className="text-gray-400 text-sm">Max: 1024 KB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setImage(null);
                                setImagePreview(null);
                              }}
                              className="bg-black/50 backdrop-blur-sm text-white p-2.5 rounded-xl hover:bg-black/70 transition-colors border border-gray-800 hover:border-gray-600"
                              disabled={loading}
                            >
                              <Icons.XMark />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-3 border-dashed border-gray-800/50 rounded-2xl p-10 text-center bg-black/20 backdrop-blur-sm hover:border-gray-700/50 hover:bg-black/30 transition-all duration-300 group/upload">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
                          <Icons.Photo />
                        </div>
                        <p className="text-gray-300 mb-3 font-medium text-lg">Upload a cover image</p>
                        <div className="grid grid-cols-2 gap-3 mb-8 max-w-md mx-auto">
                          <p className="text-sm text-gray-500 flex items-center gap-2 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50"></span>
                            Max 1MB size
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-2 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50"></span>
                            JPG, PNG, WebP, GIF
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-2 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50"></span>
                            1200x630px recommended
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-2 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50"></span>
                            1:2 to 2:1 aspect ratio
                          </p>
                        </div>
                        <label className="inline-block cursor-pointer group/button">
                          <span className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:-translate-y-0.5 transition-all duration-200 font-medium shadow-lg shadow-purple-500/25 flex items-center gap-2 justify-center mx-auto w-fit">
                            <Icons.Upload />
                            Choose Image
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={loading}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Status Display */}
                  {status && (
                    <div className={`
                      p-5 rounded-2xl border-2 backdrop-blur-sm
                      ${status.includes('✅') || status.includes('successfully')
                        ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/30'
                        : status.includes('❌')
                        ? 'bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/30'
                        : 'bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center
                          ${status.includes('✅') || status.includes('successfully')
                            ? 'bg-emerald-500/20'
                            : status.includes('❌')
                            ? 'bg-red-500/20'
                            : 'bg-blue-500/20'
                          }
                        `}>
                          {status.includes('✅') || status.includes('successfully') ? (
                            <Icons.Check />
                          ) : status.includes('❌') ? (
                            <Icons.XMark />
                          ) : (
                            <Icons.InformationCircle />
                          )}
                        </div>
                        <p className="text-sm font-medium flex-1">{status}</p>
                      </div>
                    </div>
                  )}

                  {/* Create Button */}
                  <div className="pt-8 border-t border-gray-800/50">
                    <button
                      onClick={createProject}
                      disabled={loading || !title.trim() || !description.trim() || !wallet || (tagList.length === 0 && !tags.trim())}
                      className="w-full px-8 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_auto] animate-gradient text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg relative overflow-hidden group/launch"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/launch:translate-x-[100%] transition-transform duration-1000"></div>
                      {loading ? (
                        <span className="flex items-center justify-center gap-3 relative">
                          <div className="w-6 h-6 border-3 border-transparent border-t-white border-r-white rounded-full animate-spin"></div>
                          <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                            Creating Project...
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-3 relative">
                          <Icons.Lightning />
                          <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                            Launch Project on Blockchain
                          </span>
                        </span>
                      )}
                    </button>
                    
                    <div className="mt-6 p-5 bg-black/20 backdrop-blur-sm rounded-2xl border border-gray-800/30">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(!title.trim() || !description.trim()) && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400/50"></div>
                            <p className="text-xs text-gray-400">
                              Title and Description required
                            </p>
                          </div>
                        )}
                        
                        {(tagList.length === 0 && !tags.trim()) && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400/50"></div>
                            <p className="text-xs text-gray-400">
                              At least one tag required
                            </p>
                          </div>
                        )}
                        
                        {!wallet && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                            <p className="text-xs text-red-400">
                              Connect wallet to create project
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-8">
            {/* Creation Process Card */}
            <div className="bg-gradient-to-br from-gray-900/40 to-gray-900/20 backdrop-blur-xl rounded-3xl border border-gray-800/50 p-7 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                  <Icons.InformationCircle />
                </div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-200 to-gray-300 bg-clip-text text-transparent">
                  Creation Process
                </h3>
              </div>
              <div className="space-y-6">
                {[
                  { number: 1, title: "Upload to IPFS", desc: "Images and metadata stored on decentralized IPFS" },
                  { number: 2, title: "Validate Metadata", desc: "Ensure all fields are properly formatted" },
                  { number: 3, title: "Smart Contract Call", desc: "Register project on the blockchain" },
                  { number: 4, title: "Transaction Confirmation", desc: "Wait for blockchain confirmation" },
                  { number: 5, title: "Project Live", desc: "Your project is now live on the network" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 group/item">
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 flex-shrink-0
                      ${step > item.number 
                        ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/30'
                        : step === item.number
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-transparent shadow-lg shadow-purple-500/25'
                        : 'bg-gray-900/50 border-gray-800/50'
                      }
                    `}>
                      {step > item.number ? (
                        <Icons.Check />
                      ) : (
                        item.number
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={`font-medium transition-colors ${step >= item.number ? 'text-white' : 'text-gray-500'}`}>
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 gap-5">
              <div className="bg-gradient-to-br from-gray-900/40 to-gray-900/20 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-6 hover:border-purple-500/30 transition-all duration-300 group/card">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30 group-hover/card:border-purple-500/50 transition-colors">
                    <Icons.Shield />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Secure & Immutable</h3>
                    <p className="text-xs text-purple-400/70">Fully decentralized</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Your project is stored permanently on IPFS and recorded on-chain. Only you can modify it.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-900/40 to-gray-900/20 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-6 hover:border-purple-500/30 transition-all duration-300 group/card">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30 group-hover/card:border-purple-500/50 transition-colors">
                    <Icons.CurrencyDollar />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Gas Fee Required</h3>
                    <p className="text-xs text-purple-400/70">Network transaction</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  You'll need to pay a small gas fee to deploy your project contract on the blockchain.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-900/40 to-gray-900/20 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-6 hover:border-purple-500/30 transition-all duration-300 group/card">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30 group-hover/card:border-purple-500/50 transition-colors">
                    <Icons.Globe />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Global Access</h3>
                    <p className="text-xs text-purple-400/70">Permissionless network</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Once created, your project is accessible worldwide through the decentralized network.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}