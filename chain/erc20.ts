/**
 * ERC20 helpers.
 *
 * Token metadata is resolved from the configured token list first, and only
 * probed on-chain for custom addresses.
 *
 * `decimals` is never guessed. A wrong decimals value misstates every amount
 * in the UI by orders of magnitude, so if a token will not report it we fail
 * rather than assume 18.
 */

import { Contract, Signature, type Provider, type Signer } from 'ethers';
import { getChain, type TokenInfo } from './config';

export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
] as const;

/**
 * EIP-2612. `eip712Domain` is ERC-5267 and is what OpenZeppelin's ERC20Permit
 * exposes — reading the domain rather than reconstructing it means the
 * signature cannot be invalidated by guessing the token's `version` string
 * wrong, which is the usual way permit integrations break.
 */
export const ERC20_PERMIT_ABI = [
  'function nonces(address owner) view returns (uint256)',
  'function eip712Domain() view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)',
] as const;

export function getErc20(address: string, runner: Provider | Signer): Contract {
  return new Contract(address, ERC20_ABI, runner);
}

export interface PermitSignature {
  deadline: bigint;
  v: number;
  r: string;
  s: string;
}

/**
 * Whether a token can be approved by signature instead of a transaction.
 *
 * Worth one read: it is the difference between funding an escrow in two wallet
 * confirmations and three, and the second of those costs gas.
 */
export async function supportsPermit(
  tokenAddress: string,
  owner: string,
  provider: Provider,
): Promise<boolean> {
  const token = new Contract(tokenAddress, ERC20_PERMIT_ABI, provider);
  try {
    await Promise.all([token.nonces(owner), token.eip712Domain()]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Signs an EIP-2612 approval.
 *
 * Costs no gas and broadcasts nothing — the signature is handed to
 * `fundWithPermit`, which applies the approval and the deposit in one
 * transaction. The escrow contract swallows a failing permit and falls through
 * to a plain `fund()`, so a griefer front-running the permit cannot block the
 * deposit where an allowance already exists.
 */
export async function signPermit(
  signer: Signer,
  tokenAddress: string,
  spender: string,
  value: bigint,
  /** Signature validity. Short by default: it authorises moving money. */
  ttlSeconds = 30 * 60,
): Promise<PermitSignature> {
  const owner = await signer.getAddress();
  const provider = signer.provider;
  if (!provider) throw new Error('This wallet is not connected to a network.');

  const token = new Contract(tokenAddress, ERC20_PERMIT_ABI, provider);
  const [nonce, domainData] = await Promise.all([
    token.nonces(owner) as Promise<bigint>,
    token.eip712Domain() as Promise<{
      name: string;
      version: string;
      chainId: bigint;
      verifyingContract: string;
    }>,
  ]);

  const deadline = BigInt(Math.floor(Date.now() / 1000) + ttlSeconds);

  const signature = await signer.signTypedData(
    {
      name: domainData.name,
      version: domainData.version,
      chainId: domainData.chainId,
      verifyingContract: domainData.verifyingContract,
    },
    {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    { owner, spender, value, nonce, deadline },
  );

  const { v, r, s } = Signature.from(signature);
  return { deadline, v, r, s };
}

export class UnreadableTokenError extends Error {
  address: string;

  constructor(address: string) {
    super(
      'This token does not report its decimals, so amounts cannot be displayed accurately. It is not safe to use for escrow.',
    );
    this.name = 'UnreadableTokenError';
    this.address = address;
  }
}

/**
 * Symbol, name and decimals are fixed at deployment for every ERC20 worth
 * escrowing, so an address only has to be read once per process.
 */
const tokenInfoCache = new Map<string, TokenInfo>();

/**
 * Resolves symbol/name/decimals for a token address.
 *
 * Known tokens short-circuit to the config table — no RPC call, and no
 * dependency on the token implementing optional metadata methods.
 *
 * For everything else the three reads are issued together. Awaiting `decimals`
 * before starting `symbol`/`name` made this two round trips, on top of the one
 * that had to resolve the token address in the first place — three sequential
 * trips to render a single escrow row.
 */
export async function getTokenInfo(
  address: string,
  provider: Provider,
  chainId: number,
): Promise<TokenInfo> {
  const known = getChain(chainId)?.tokens.find(
    (token) => token.address.toLowerCase() === address.toLowerCase(),
  );
  if (known) return known;

  const cacheKey = `${chainId}:${address.toLowerCase()}`;
  const cached = tokenInfoCache.get(cacheKey);
  if (cached) return cached;

  const token = getErc20(address, provider);

  // Symbol and name are optional in ERC20; an unnamed token is usable, an
  // undecimalled one is not — hence the bare read for decimals and the
  // tolerant ones either side of it.
  const [rawDecimals, symbol, name] = await Promise.all([
    (token.decimals() as Promise<bigint>).catch(() => null),
    token.symbol().catch(() => 'Unknown'),
    token.name().catch(() => 'Unknown token'),
  ]);

  if (rawDecimals === null) throw new UnreadableTokenError(address);
  const decimals = Number(rawDecimals);
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new UnreadableTokenError(address);
  }

  const info: TokenInfo = {
    address: address as `0x${string}`,
    symbol: String(symbol),
    name: String(name),
    decimals,
  };
  tokenInfoCache.set(cacheKey, info);
  return info;
}

export async function getAllowance(
  tokenAddress: string,
  owner: string,
  spender: string,
  provider: Provider,
): Promise<bigint> {
  return getErc20(tokenAddress, provider).allowance(owner, spender);
}

export async function getBalance(
  tokenAddress: string,
  owner: string,
  provider: Provider,
): Promise<bigint> {
  return getErc20(tokenAddress, provider).balanceOf(owner);
}
