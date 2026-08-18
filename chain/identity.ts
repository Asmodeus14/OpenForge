/**
 * Facts about an address that can be established from the chain alone.
 *
 * Used to sanity-check a payment recipient before a contract is deployed. All
 * three signals below are cheap, exact and unforgeable — unlike a profile
 * name, which is self-asserted and proves only that whoever controls the key
 * chose that string.
 *
 * Nothing here is presented as identity verification. The distinction matters:
 * these checks catch a mistyped address, not an impostor.
 */

import type { Provider } from 'ethers';

export interface AddressActivity {
  address: string;
  /**
   * The address has deployed bytecode. Escrow payouts use `safeTransfer`, so
   * a contract that cannot move ERC20 tokens would strand every release.
   */
  isContract: boolean;
  /**
   * Transactions ever sent from this address on this chain. Zero is the
   * strongest available signal of a typo: a wallet nobody has ever used.
   */
  outgoingTransactions: number;
}

export async function getAddressActivity(
  address: string,
  provider: Provider,
): Promise<AddressActivity> {
  const [code, nonce] = await Promise.all([
    provider.getCode(address),
    provider.getTransactionCount(address),
  ]);

  return {
    address,
    isContract: code !== '0x',
    outgoingTransactions: nonce,
  };
}
