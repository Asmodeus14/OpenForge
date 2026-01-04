// hooks/web3.ts
import React, { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { ProjectRegistryABI, PROJECT_CONTRACT_ADDRESS, ProjectStatus } from "../contracts/ProjectRegistryABI"
import { ProfileRegistryABI, PROFILE_CONTRACT_ADDRESS } from "../contracts/ProfileRegistryABI"

interface IWeb3Context {
  account: string | null
  chainId: number | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  error: string | null
  isConnecting: boolean
  isWalletInstalled: boolean
  
  // Project Registry
  projectContract: ethers.Contract | null
  registerProject: (metadataCID: string) => Promise<ethers.ContractTransactionResponse | null>
  updateProjectStatus: (projectId: number, status: ProjectStatus) => Promise<ethers.ContractTransactionResponse | null>
  getProject: (projectId: number) => Promise<{ builder: string; metadataCID: string; status: number; id: number }>
  getAllProjects: () => Promise<{ id: number; builder: string; metadataCID: string; status: number }[]>
  
  // Profile Registry
  profileContract: ethers.Contract | null
  createProfile: (cid: string) => Promise<ethers.ContractTransactionResponse | null>
  updateProfile: (cid: string) => Promise<ethers.ContractTransactionResponse | null>
  getProfile: (address: string) => Promise<string | null>
  getProfileMetadata: (cid: string) => Promise<Record<string, unknown>>
  
  // Chat Authentication
  getSigner: () => Promise<ethers.Signer | null>
  signMessage: (message: string) => Promise<string>
}

const Web3Context = createContext<IWeb3Context | undefined>(undefined)

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isWalletInstalled, setIsWalletInstalled] = useState(false)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [projectContract, setProjectContract] = useState<ethers.Contract | null>(null)
  const [profileContract, setProfileContract] = useState<ethers.Contract | null>(null)

  // Check if wallet is installed
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      setIsWalletInstalled(true)
    }
  }, [])

  // Initialize ethers when account changes
  useEffect(() => {
    if (account && window.ethereum) {
      const initEthers = async () => {
        try {
          // Using ethers v6
          const web3Provider = new ethers.BrowserProvider(window.ethereum)
          const web3Signer = await web3Provider.getSigner()
          
          // Initialize Project Contract
          const projectContractInstance = new ethers.Contract(
            PROJECT_CONTRACT_ADDRESS, 
            ProjectRegistryABI, 
            web3Signer
          )
          
          // Initialize Profile Contract
          const profileContractInstance = new ethers.Contract(
            PROFILE_CONTRACT_ADDRESS,
            ProfileRegistryABI,
            web3Signer
          )
          
          setProvider(web3Provider)
          setSigner(web3Signer)
          setProjectContract(projectContractInstance)
          setProfileContract(profileContractInstance)
        } catch (err) {
          console.error("Error initializing ethers:", err)
          setError("Failed to initialize contracts")
        }
      }
      
      initEthers()
    } else {
      setProvider(null)
      setSigner(null)
      setProjectContract(null)
      setProfileContract(null)
    }
  }, [account])

  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask or another Web3 wallet')
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Get chain ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId'
      })

      setAccount(accounts[0])
      setChainId(parseInt(chainIdHex, 16))
      setIsWalletInstalled(true)

      // Set up event listeners
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          setAccount(accounts[0])
        }
      })

      window.ethereum.on('chainChanged', (chainId: string) => {
        setChainId(parseInt(chainId, 16))
        window.location.reload()
      })

    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
      console.error('Wallet connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setChainId(null)
    setError(null)
    setProvider(null)
    setSigner(null)
    setProjectContract(null)
    setProfileContract(null)
    
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged')
      window.ethereum.removeAllListeners('chainChanged')
    }
  }, [])

  // Chat-specific functions
  const getSigner = useCallback(async () => {
    if (!account || !window.ethereum) return null
    
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      return await web3Provider.getSigner()
    } catch (err) {
      console.error("Error getting signer:", err)
      return null
    }
  }, [account])

  const signMessage = useCallback(async (message: string) => {
    if (!account) throw new Error('Wallet not connected')
    
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      const web3Signer = await web3Provider.getSigner()
      return await web3Signer.signMessage(message)
    } catch (err: any) {
      throw new Error(err.message || 'Failed to sign message')
    }
  }, [account])

  // Project Registry Functions (keep existing)
  const registerProject = useCallback(async (metadataCID: string) => {
    if (!projectContract || !account) {
      throw new Error('Wallet not connected')
    }

    try {
      const tx = await projectContract.registerProject(metadataCID)
      await tx.wait()
      return tx
    } catch (err: any) {
      throw new Error(err.message || 'Failed to register project')
    }
  }, [projectContract, account])

  const updateProjectStatus = useCallback(async (projectId: number, status: ProjectStatus) => {
    if (!projectContract || !account) {
      throw new Error('Wallet not connected')
    }

    try {
      const tx = await projectContract.updateProjectStatus(projectId, status)
      await tx.wait()
      return tx
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update project status')
    }
  }, [projectContract, account])

  const getProject = useCallback(async (projectId: number) => {
    if (!projectContract) {
      throw new Error('Project contract not initialized')
    }

    try {
      const project = await projectContract.getProject(projectId)
      return {
        builder: project.builder,
        metadataCID: project.metadataCID,
        status: Number(project.status),
        id: projectId
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to fetch project')
    }
  }, [projectContract])

  const getAllProjects = useCallback(async () => {
    if (!projectContract) {
      throw new Error('Project contract not initialized')
    }

    try {
      const nextId = await projectContract.nextProjectId()
      const projectCount = Number(nextId)
      const projects = []

      for (let i = 0; i < projectCount; i++) {
        try {
          const project = await projectContract.getProject(i)
          projects.push({
            id: i,
            builder: project.builder,
            metadataCID: project.metadataCID,
            status: Number(project.status)
          })
        } catch (err) {
          console.warn(`Failed to fetch project ${i}:`, err)
        }
      }

      return projects
    } catch (err: any) {
      throw new Error(err.message || 'Failed to fetch projects')
    }
  }, [projectContract])

  // Profile Registry Functions
  const createProfile = useCallback(async (cid: string) => {
    if (!profileContract || !account) {
      throw new Error('Wallet not connected')
    }

    try {
      const tx = await profileContract.createProfile(cid)
      await tx.wait()
      return tx
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create profile')
    }
  }, [profileContract, account])

  const updateProfile = useCallback(async (cid: string) => {
    if (!profileContract || !account) {
      throw new Error('Wallet not connected')
    }

    try {
      const hasProfile = await profileContract.hasProfile(account)
      if (!hasProfile) {
        throw new Error('Profile does not exist')
      }
      
      const tx = await profileContract.updateProfile(cid)
      await tx.wait()
      return tx
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update profile')
    }
  }, [profileContract, account])

  const getProfile = useCallback(async (address: string): Promise<string | null> => {
    if (!profileContract) {
      throw new Error('Profile contract not initialized')
    }

    try {
      const hasProfile = await profileContract.hasProfile(address)
      if (!hasProfile) {
        return null
      }
      
      const cid = await profileContract.getProfile(address)
      return cid
    } catch (err: any) {
      console.error('Failed to get profile:', err)
      return null
    }
  }, [profileContract])

  const getProfileMetadata = useCallback(async (cid: string) => {
    if (!cid) return null
    
    try {
      const response = await fetch(`https://ipfs.io/ipfs/${cid}`)
      if (!response.ok) {
        throw new Error('Failed to fetch metadata')
      }
      
      return await response.json()
    } catch (err: any) {
      console.error('Failed to fetch profile metadata:', err)
      throw new Error('Failed to fetch profile metadata')
    }
  }, [])

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window.ethereum !== 'undefined' && window.ethereum.selectedAddress) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
            setAccount(accounts[0])
            setChainId(parseInt(chainIdHex, 16))
            
            // Set up event listeners
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
              if (accounts.length === 0) {
                disconnectWallet()
              } else {
                setAccount(accounts[0])
              }
            })

            window.ethereum.on('chainChanged', (chainId: string) => {
              setChainId(parseInt(chainId, 16))
              window.location.reload()
            })
          }
        } catch (err) {
          console.error('Error checking existing connection:', err)
        }
      }
    }

    checkExistingConnection()
  }, [disconnectWallet])

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        connectWallet,
        disconnectWallet,
        error,
        isConnecting,
        isWalletInstalled,
        
        // Project Registry
        projectContract,
        registerProject,
        updateProjectStatus,
        getProject,
        getAllProjects,
        
        // Profile Registry
        profileContract,
        createProfile,
        updateProfile,
        getProfile,
        getProfileMetadata,
        
        // Chat functions
        getSigner,
        signMessage
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

// TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}