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

import { Contract, type Provider, type Signer } from 'ethers';
import { getChain, type TokenInfo } from './config';

export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
] as const;

export function getErc20(address: string, runner: Provider | Signer): Contract {
  return new Contract(address, ERC20_ABI, runner);
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
 * Resolves symbol/name/decimals for a token address.
 *
 * Known tokens short-circuit to the config table — no RPC call, and no
 * dependency on the token implementing optional metadata methods.
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

  const token = getErc20(address, provider);

  let decimals: number;
  try {
    decimals = Number(await token.decimals());
  } catch {
    throw new UnreadableTokenError(address);
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new UnreadableTokenError(address);
  }

  // Symbol and name are optional in ERC20; an unnamed token is usable, an
  // undecimalled one is not.
  const [symbol, name] = await Promise.all([
    token.symbol().catch(() => 'Unknown'),
    token.name().catch(() => 'Unknown token'),
  ]);

  return {
    address: address as `0x${string}`,
    symbol: String(symbol),
    name: String(name),
    decimals,
  };
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
