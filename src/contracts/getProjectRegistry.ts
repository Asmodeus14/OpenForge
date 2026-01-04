import { ethers } from "ethers"
import {
  ProjectRegistryABI,
  PROJECT_CONTRACT_ADDRESS
} from "./ProjectRegistryABI"

export async function getProjectRegistry() {
  if (!window.ethereum) {
    throw new Error("Wallet not found")
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()

  return new ethers.Contract(
    PROJECT_CONTRACT_ADDRESS,
    ProjectRegistryABI,
    signer
  )
}
