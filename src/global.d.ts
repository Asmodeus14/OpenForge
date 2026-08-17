/**
 * The single declaration of the injected wallet provider.
 *
 * This was previously declared twice — in `hooks/web3.tsx` and `pages/EsCrow.tsx`
 * — both as `any`, and with mismatched modifiers, which produced a standing
 * TS2687 error. One typed declaration, in one place.
 */

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: never[]) => void) => void;
  removeListener?: (event: string, handler: (...args: never[]) => void) => void;
  removeAllListeners?: (event?: string) => void;
  isMetaMask?: boolean;
  selectedAddress?: string | null;
}

interface Window {
  ethereum?: EthereumProvider;
}
