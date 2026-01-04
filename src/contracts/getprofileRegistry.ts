import { ethers } from "ethers";
import {
  PROFILE_CONTRACT_ADDRESS,
  ProfileRegistryABI
} from "./ProfileRegistryABI";

export async function getProfileRegistry() {
  if (!window.ethereum) {
    throw new Error("Wallet not found");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return new ethers.Contract(
    PROFILE_CONTRACT_ADDRESS,
    ProfileRegistryABI,
    signer
  );
}
