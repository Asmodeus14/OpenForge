/**
 * Provider and signer access.
 *
 * Two distinct capabilities, deliberately separated:
 *
 *   getReadProvider()   — public data, no wallet required
 *   getSigner()         — signing and sending, wallet required
 *
 * Previously every read went through `provider.getSigner()`, which meant
 * viewing someone's public profile or browsing projects demanded a connected
 * wallet. Reading public chain data should never require one.
 */

import { BrowserProvider, JsonRpcProvider, type Signer } from 'ethers';
import { DEFAULT_CHAIN, SEPOLIA_CHAIN_ID, getChain } from './config';

// `Window.ethereum` is declared once, in src/global.d.ts.

export class WalletNotConnectedError extends Error {
  constructor() {
    super('No wallet is connected.');
    this.name = 'WalletNotConnectedError';
  }
}

export class WalletNotInstalledError extends Error {
  constructor() {
    super('No Ethereum wallet was detected in this browser.');
    this.name = 'WalletNotInstalledError';
  }
}

export function isWalletInstalled(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

/* ------------------------------------------------------------------ reading */

const RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  // Keyless public endpoint. Replaces the Infura project key that was
  // hardcoded into two source files and shipped in the bundle.
  'https://ethereum-sepolia-rpc.publicnode.com';

let readProvider: JsonRpcProvider | undefined;

/**
 * A read-only provider for the target chain. Shared across the app so
 * ethers can batch concurrent calls into a single RPC request.
 */
export function getReadProvider(): JsonRpcProvider {
  if (!readProvider) {
    readProvider = new JsonRpcProvider(RPC_URL, {
      chainId: SEPOLIA_CHAIN_ID,
      name: DEFAULT_CHAIN.name,
    });
  }
  return readProvider;
}

/* ------------------------------------------------------------------ writing */

export function getBrowserProvider(): BrowserProvider {
  if (!isWalletInstalled()) throw new WalletNotInstalledError();
  return new BrowserProvider(window.ethereum!);
}

export async function getSigner(): Promise<Signer> {
  const provider = getBrowserProvider();
  const accounts = await provider.listAccounts();
  if (accounts.length === 0) throw new WalletNotConnectedError();
  return provider.getSigner();
}

export async function requestAccounts(): Promise<string[]> {
  if (!isWalletInstalled()) throw new WalletNotInstalledError();
  const accounts = (await window.ethereum!.request({
    method: 'eth_requestAccounts',
  })) as string[];
  return accounts;
}

export async function getConnectedChainId(): Promise<number | undefined> {
  if (!isWalletInstalled()) return undefined;
  const hex = (await window.ethereum!.request({ method: 'eth_chainId' })) as string;
  return Number.parseInt(hex, 16);
}

/**
 * Asks the wallet to switch to the target chain, adding it if unknown.
 * Surfaced behind an explicit "Switch to Sepolia" action rather than being
 * triggered silently.
 */
export async function switchToSupportedChain(chainId = SEPOLIA_CHAIN_ID): Promise<void> {
  const chain = getChain(chainId);
  if (!chain) throw new Error(`Chain ${chainId} is not supported by this application.`);
  if (!isWalletInstalled()) throw new WalletNotInstalledError();

  const hexChainId = `0x${chain.chainId.toString(16)}`;
  try {
    await window.ethereum!.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
  } catch (error) {
    // 4902 = the wallet does not know this chain yet.
    const code = (error as { code?: number })?.code;
    if (code !== 4902) throw error;

    await window.ethereum!.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: hexChainId,
          chainName: chain.label,
          nativeCurrency: { name: chain.nativeSymbol, symbol: 'ETH', decimals: 18 },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [chain.explorer],
        },
      ],
    });
  }
}
