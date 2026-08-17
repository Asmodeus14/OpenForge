/**
 * Chain configuration — the single source of truth for networks, tokens,
 * contract addresses and protocol constants.
 *
 * Replaces the 185-line `COMMON_ERC20_TOKENS` array and the 13-case
 * `getNetworkInfo` switch that used to live inside EsCrow.tsx.
 *
 * OpenForge is deployed only to Sepolia. Every contract below was verified
 * against the deployment records in OpenForge-Contracts, with no ABI drift.
 */

export const SEPOLIA_CHAIN_ID = 11155111;

export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
}

export interface ChainInfo {
  chainId: number;
  name: string;
  /** Shown in the UI verbatim. Keep it accurate — users act on this. */
  label: string;
  nativeSymbol: string;
  explorer: string;
  testnet: boolean;
  /** Tokens the escrow accepts. Users may also enter a custom address. */
  tokens: TokenInfo[];
  contracts: {
    profileRegistry: `0x${string}`;
    projectRegistry: `0x${string}`;
    escrowRegistry: `0x${string}`;
  };
}

export const CHAINS: Record<number, ChainInfo> = {
  [SEPOLIA_CHAIN_ID]: {
    chainId: SEPOLIA_CHAIN_ID,
    name: 'Sepolia',
    label: 'Sepolia testnet',
    nativeSymbol: 'SepoliaETH',
    explorer: 'https://sepolia.etherscan.io',
    testnet: true,
    tokens: [
      {
        // The project's own test token — the only ERC20 the deployer holds a
        // balance of, and the one the escrow was actually exercised against.
        //
        // The previous token list shipped mainnet USDT/USDC/DAI/WBTC (which
        // do not exist here) and labelled 0x779877A7… "Sepolia USDC" — that
        // address is Chainlink LINK. Approving it would have moved the wrong
        // asset. Both problems are removed by listing only what is real.
        address: '0xbe82627f5d7ba5774df41dacdb2415b66ab2b780',
        symbol: 'tUSDC',
        name: 'Test USD Coin',
        decimals: 6,
      },
    ],
    contracts: {
      profileRegistry: '0xb8c5a55D3b0E838e2f96cBdF893f90c5362F3E46',
      projectRegistry: '0x8796CbE1a841690E51DB3212C88533c0213c66d2',
      escrowRegistry: '0x19B0aB8A58684F2d4C8E1B0cC4D3e9Ad73d0d59a',
    },
  },
};

/** The chain the app targets. Everything else is a wrong-network state. */
export const DEFAULT_CHAIN = CHAINS[SEPOLIA_CHAIN_ID];

export function getChain(chainId: number | bigint | undefined | null): ChainInfo | undefined {
  if (chainId === undefined || chainId === null) return undefined;
  return CHAINS[Number(chainId)];
}

export function isSupportedChain(chainId: number | bigint | undefined | null): boolean {
  return getChain(chainId) !== undefined;
}

/**
 * Protocol constants read from the deployed contract source.
 *
 * These are `constant` in Solidity — baked into bytecode with no setter — so
 * mirroring them here is safe. They are surfaced to users at the point of
 * decision rather than buried, because each one materially affects what
 * happens to their money or their profile.
 */
export const PROTOCOL = {
  /** SimpleMilestoneEscrow.FEE_BASIS_POINTS — 150 bps = 1.5%. */
  feeBasisPoints: 150n,
  /** SimpleMilestoneEscrow.FEE_RECIPIENT — a fixed address, not a treasury contract. */
  feeRecipient: '0xC869d7a99fa831b4B3bEe7e245F0C9348C2209a3' as const,
  /**
   * Charged only on `releaseMilestone`. No fee is taken on dispute
   * resolution or project cancellation.
   */
  feeChargedOn: 'release' as const,
  /**
   * The developer may call `resolveDisputeToDeveloper()` only after this
   * period. The funder may call `resolveDisputeToFunder()` immediately.
   * Inlined as `30 days` in the contract with no public constant to read.
   */
  disputeTimeoutSeconds: 30n * 24n * 60n * 60n,
  /** ProfileRegistry.UPDATE_COOLDOWN — 14 days, no override exists. */
  profileUpdateCooldownSeconds: 14n * 24n * 60n * 60n,
} as const;

/** Gross → fee. Mirrors `(amount * FEE_BASIS_POINTS) / 10000`. */
export function calculateFee(grossAmount: bigint): bigint {
  return (grossAmount * PROTOCOL.feeBasisPoints) / 10_000n;
}

/** Gross → what the developer actually receives. */
export function calculateNetAmount(grossAmount: bigint): bigint {
  return grossAmount - calculateFee(grossAmount);
}

/** Block explorer link for a transaction hash. */
export function explorerTxUrl(chainId: number | bigint, hash: string): string | undefined {
  const chain = getChain(chainId);
  return chain ? `${chain.explorer}/tx/${hash}` : undefined;
}

/** Block explorer link for an address or contract. */
export function explorerAddressUrl(
  chainId: number | bigint,
  address: string,
): string | undefined {
  const chain = getChain(chainId);
  return chain ? `${chain.explorer}/address/${address}` : undefined;
}
