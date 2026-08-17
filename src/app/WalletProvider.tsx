import { createContext, useContext, type ReactNode } from 'react';
import { useWallet, type UseWalletResult } from '../hooks/useWallet';

const WalletContext = createContext<UseWalletResult | null>(null);

/**
 * Shares one wallet connection across the app.
 *
 * The value is memoised inside `useWallet`, so consumers only re-render when
 * the connection actually changes.
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}

export function useWalletContext(): UseWalletResult {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used inside <WalletProvider>.');
  }
  return context;
}
