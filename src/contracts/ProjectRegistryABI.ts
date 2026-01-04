// contracts/ProjectRegistryABI.ts

// Updated to match the contract's Status enum: { Draft, Funding, Completed, Failed }
export const ProjectStatus = {
  Draft: 0,
  Funding: 1,
  Completed: 2,
  Failed: 3, // Note: Changed from "Cancelled" to "Failed" to match contract
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const ProjectRegistryABI = [
  // ========== FUNCTIONS ==========
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "metadataCID",
        "type": "string"
      }
    ],
    "name": "registerProject",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "newMetadataCID",
        "type": "string"
      }
    ],
    "name": "updateProjectMetadata",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "newStatus",
        "type": "uint8"
      }
    ],
    "name": "updateProjectStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      }
    ],
    "name": "getProject",
    "outputs": [
      {
        "internalType": "address",
        "name": "builder",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "metadataCID",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "status",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextProjectId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // ========== EVENTS ==========
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "builder",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "metadataCID",
        "type": "string"
      }
    ],
    "name": "ProjectRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "oldStatus",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "newStatus",
        "type": "uint8"
      }
    ],
    "name": "ProjectStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "projectId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newMetadataCID",
        "type": "string"
      }
    ],
    "name": "ProjectMetadataUpdated",
    "type": "event"
  }
] as const;

// Contract address - replace with your deployed contract address
export const PROJECT_CONTRACT_ADDRESS = "0x8FC5B7c7CcAa22A062ab29216f29317d7BE85106";