// types.ts
export interface ProjectData {
  id: number;
  name: string;
  description: string;
  image: string;
  creator: string;
  timestamp: string;
  // Add other fields as needed
}

export interface ProjectFromContract {
  cid: string; // bytes32
  creator: string;
  timestamp: bigint;
}