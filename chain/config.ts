/**
 * Chain configuration — the single source of truth for networks, tokens,
 * contract addresses and protocol constants.
 *
 * Replaces the 185-line `COMMON_ERC20_TOKENS` array and the 13-case
 * `getNetworkInfo` switch that used to live inside EsCrow.tsx.
 *
 * OpenForge is deployed only to Sepolia.
 *
 * `profileRegistry` and `projectRegistry` were verified against the deployment
 * records in OpenForge-Contracts, with no ABI drift. `escrowFactory` and the
 * tUSDC below were deployed from this repository's own sources by
 * `scripts/deploy.js`, and their ABIs are generated from the build artifacts
 * rather than transcribed, so drift is not possible.
 */

export const SEPOLIA_CHAIN_ID = 11155111;

export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  /**
   * Where this token comes from. Shown in the picker because a symbol is not
   * unique — two different contracts below both call themselves "USDC" — and
   * picking the wrong one means approving the wrong asset.
   */
  note?: string;
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
    /**
     * Deploys every escrow and is the registry of the ones it made.
     *
     * These were two things before: a standalone registry that accepted *any*
     * address as an escrow, authenticated only by asking that address whether
     * `funder()` returned the caller. A contract holding no money could
     * register itself under any title, and the registry was what the product
     * listed. A registry that deploys what it registers cannot be lied to.
     */
    escrowFactory: `0x${string}`;
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
    // Every entry was read from Sepolia before being listed here: symbol,
    // name and decimals below are what the contract itself reports.
    //
    // The previous token list shipped mainnet USDT/USDC/DAI/WBTC, which do not
    // exist on this chain, and labelled 0x779877A7… "Sepolia USDC" with 6
    // decimals. That address is Chainlink LINK, and it has 18. Approving it
    // would have moved the wrong asset in amounts wrong by a factor of 10^12.
    // It appears below under its real name, which is the only safe way to list
    // a token: verified, or not at all.
    //
    // This list is a convenience, not a whitelist. Any ERC20 may be used via
    // the custom-address field, which probes the contract for its real
    // decimals and refuses tokens that will not report them.
    tokens: [
      {
        // The project's own test token, and the one the escrow was actually
        // exercised against. First in the list, so it is the default.
        //
        // This one supports EIP-2612 permit, which is what lets funding an
        // escrow cost one wallet confirmation instead of two, and it has a
        // public `faucet()`. Its predecessor minted its entire supply to the
        // deployer with no mint function, so the only way to get test tokens
        // was to ask a human for them.
        address: '0x1f8978Df2681C9F65714fcb12101F328C760e4dC',
        symbol: 'tUSDC',
        name: 'Test USD Coin',
        decimals: 6,
        note: "OpenForge's own test token — has a faucet",
      },
      {
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        symbol: 'USDC',
        name: 'USDC',
        decimals: 6,
        note: "Circle's official Sepolia test token",
      },
      {
        address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        note: 'The canonical Sepolia WETH',
      },
      {
        address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
        symbol: 'DAI',
        name: 'DAI',
        decimals: 18,
        note: "Aave's Sepolia faucet token",
      },
      {
        address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
        symbol: 'LINK',
        name: 'ChainLink Token',
        decimals: 18,
        note: 'Chainlink LINK — 18 decimals, not a dollar stablecoin',
      },
    ],
    contracts: {
      profileRegistry: '0xb8c5a55D3b0E838e2f96cBdF893f90c5362F3E46',
      projectRegistry: '0x8796CbE1a841690E51DB3212C88533c0213c66d2',
      escrowFactory: '0x427A2618c0A9251cc7a71058510c9197b2914249',
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
  /**
   * EscrowFactory.feeBps — 150 bps = 1.5%.
   *
   * An `immutable` set when the factory above was deployed, not a `constant`.
   * It is therefore fixed for every escrow this factory makes, which is what
   * makes mirroring it here safe — but it is a property of *this deployment*,
   * so anything that moves money reads it from the chain rather than trusting
   * this line. See `fetchFactoryTerms`.
   */
  feeBasisPoints: 150n,
  /**
   * Where release fees go. Also an immutable on the factory.
   *
   * It used to be a compile-time constant baked into every escrow's bytecode,
   * which meant a lost or compromised key would have sent the fees of every
   * past and future escrow to a dead address with no way to change it.
   */
  feeRecipient: '0x8E1371C3748709C924a1605aD850da7626B8799f' as const,
  /**
   * Charged only on `release`. Nothing is taken when money goes back to the
   * funder by `reclaim` or `sweep` — that is their own deposit returning, and
   * charging to return it would be charging for a service not rendered.
   */
  feeChargedOn: 'release' as const,
  /**
   * MilestoneEscrow.DISPUTE_WINDOW — a dispute freezes `reclaim` for 14 days
   * and then lapses on its own.
   *
   * This is not the old 30-day timer, and it does not do the same thing. The
   * previous contract let the funder resolve a dispute in their own favour
   * immediately while the developer waited thirty days, so the funder won every
   * dispute by construction. A dispute now decides nothing and moves no money:
   * it buys whoever raised it a fixed window in which the funder cannot pull
   * committed funds, and either party may raise one, once each.
   */
  disputeWindowSeconds: 14n * 24n * 60n * 60n,
  /**
   * MilestoneEscrow.SWEEP_GRACE — once every deadline is this far past,
   * anyone may return what is left to the funder.
   *
   * Permissionless because the destination is fixed. Without it, a funder who
   * walks away leaves the money sitting in a contract nobody can touch.
   */
  sweepGraceSeconds: 30n * 24n * 60n * 60n,
  /** MilestoneEscrow.MAX_MILESTONES — the constructor reverts past this. */
  maxMilestones: 50,
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
