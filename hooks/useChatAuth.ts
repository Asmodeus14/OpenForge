'use client';

/**
 * Chat sign-in.
 *
 * The chat backend is a conventional server with its own JWT — it cannot read
 * the blockchain, so proving who you are means signing a nonce it issued.
 * That is an off-chain signature: it costs nothing and moves nothing, and the
 * UI says so, because an unexplained wallet prompt is what phishing looks
 * like.
 *
 * The token lives in localStorage, keyed by wallet address, and is therefore
 * genuinely external state — the server cannot know it, another tab can
 * change it, and switching accounts must not reuse the previous account's
 * session. `useSyncExternalStore` reads it with a distinct server snapshot,
 * which avoids both a hydration mismatch and a setState-in-effect cascade.
 */

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { getSigner } from '@/chain/clients';
import { requestNonce, verifySignature } from '@/lib/chat/api';
import { parseError, type ParsedError } from '@/lib/errors';

const TOKEN_PREFIX = 'openforge:chat-token:';

function storageKey(address: string): string {
  return `${TOKEN_PREFIX}${address.toLowerCase()}`;
}

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab signing in or out must be reflected here.
  window.addEventListener('storage', emit);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', emit);
  };
}

function readToken(address: string | null | undefined): string | null {
  if (!address) return null;
  try {
    return localStorage.getItem(storageKey(address));
  } catch {
    return null;
  }
}

/** The server has no access to localStorage, so it always renders signed out. */
function serverSnapshot(): null {
  return null;
}

export function useChatAuth(account: string | null | undefined) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<ParsedError | null>(null);

  const getSnapshot = useMemo(() => () => readToken(account), [account]);
  const token = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);

  const signIn = useCallback(async () => {
    if (!account) return;
    setIsSigningIn(true);
    setError(null);
    try {
      const { message } = await requestNonce(account);
      const signer = await getSigner();
      const signature = await signer.signMessage(message);
      const { token: issued } = await verifySignature(account, signature);

      try {
        localStorage.setItem(storageKey(account), issued);
      } catch {
        // Private mode. Nothing can be stored, so nothing can be restored.
      }
      emit();
    } catch (err) {
      setError(parseError(err, 'Not signed in to messaging'));
    } finally {
      setIsSigningIn(false);
    }
  }, [account]);

  /** Drops the stored token. Called on a 401 as well as by the user. */
  const signOut = useCallback(() => {
    if (!account) return;
    try {
      localStorage.removeItem(storageKey(account));
    } catch {
      // Nothing was stored.
    }
    emit();
  }, [account]);

  return { token, isSigningIn, error, signIn, signOut };
}
