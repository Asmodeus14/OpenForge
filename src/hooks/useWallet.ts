/**
 * Wallet connection state.
 *
 * A focused replacement for the 414-line `Web3Provider`, which built a fresh
 * context object on every render (re-rendering every consumer on any state
 * change), registered `accountsChanged` listeners in two places while only
 * removing them in one, and captured a stale `disconnectWallet` in a
 * `useCallback` with empty deps.
 *
 * The legacy provider stays mounted until the pages that consume it are
 * rebuilt; new code uses this.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getConnectedChainId,
  isWalletInstalled,
  requestAccounts,
  switchToSupportedChain,
} from '../chain/clients';
import { DEFAULT_CHAIN, isSupportedChain } from '../chain/config';
import { parseError, type ParsedError } from '../lib/errors';

const DISCONNECTED_KEY = 'openforge:wallet-disconnected';

export interface WalletState {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: ParsedError | null;
  installed: boolean;
  /** Connected, but to a network this app does not support. */
  wrongNetwork: boolean;
}

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<ParsedError | null>(null);

  const installed = isWalletInstalled();

  // Restore an existing authorisation without prompting. `eth_accounts`
  // (unlike `eth_requestAccounts`) never opens the wallet UI.
  useEffect(() => {
    if (!installed) return;
    if (localStorage.getItem(DISCONNECTED_KEY) === 'true') return;

    let cancelled = false;
    void (async () => {
      try {
        const accounts = (await window.ethereum!.request({
          method: 'eth_accounts',
        })) as string[];
        if (cancelled || accounts.length === 0) return;
        setAccount(accounts[0]);
        setChainId((await getConnectedChainId()) ?? null);
      } catch {
        // No authorised account. Nothing to restore.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [installed]);

  // One listener registration, with a matching removal — the previous
  // implementation leaked handlers on every connect.
  useEffect(() => {
    if (!installed) return;
    const provider = window.ethereum!;

    const onAccountsChanged = (...args: never[]) => {
      const accounts = args[0] as unknown as string[];
      setAccount(accounts?.length ? accounts[0] : null);
    };

    const onChainChanged = (...args: never[]) => {
      // Update state rather than calling window.location.reload(), which
      // discarded any in-progress form the user had filled in.
      setChainId(Number.parseInt(args[0] as unknown as string, 16));
    };

    provider.on?.('accountsChanged', onAccountsChanged);
    provider.on?.('chainChanged', onChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', onAccountsChanged);
      provider.removeListener?.('chainChanged', onChainChanged);
    };
  }, [installed]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = await requestAccounts();
      localStorage.removeItem(DISCONNECTED_KEY);
      setAccount(accounts[0] ?? null);
      setChainId((await getConnectedChainId()) ?? null);
    } catch (err) {
      setError(parseError(err, 'Wallet not connected'));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Clears local state only. A dapp cannot revoke its own permission, so
   * saying "disconnect" and meaning "forgotten locally" is the honest
   * behaviour — the flag stops us silently reconnecting on next load.
   */
  const disconnect = useCallback(() => {
    localStorage.setItem(DISCONNECTED_KEY, 'true');
    setAccount(null);
    setChainId(null);
    setError(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    setError(null);
    try {
      await switchToSupportedChain(DEFAULT_CHAIN.chainId);
      setChainId((await getConnectedChainId()) ?? null);
    } catch (err) {
      setError(parseError(err, 'Network not switched'));
    }
  }, []);

  return useMemo(
    () => ({
      account,
      chainId,
      isConnecting,
      error,
      installed,
      wrongNetwork: account !== null && chainId !== null && !isSupportedChain(chainId),
      connect,
      disconnect,
      switchNetwork,
    }),
    [account, chainId, isConnecting, error, installed, connect, disconnect, switchNetwork],
  );
}

export type UseWalletResult = ReturnType<typeof useWallet>;
