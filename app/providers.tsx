'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { WalletProvider } from '@/components/wallet/WalletProvider';

/**
 * Client-side providers.
 *
 * Kept deliberately thin and mounted as low as the app allows, so that pages
 * and layouts can stay Server Components. Only what genuinely needs browser
 * state lives here: theme, wallet connection, and the query cache.
 */
export function Providers({ children }: { children: ReactNode }) {
  // Created per-client rather than at module scope, so a server render never
  // shares a cache between requests.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Chain reads are idempotent; refetching on every focus causes
            // visible flicker and pointless RPC load.
            refetchOnWindowFocus: false,
            staleTime: 30_000,
            retry: 1,
            retryDelay: 800,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WalletProvider>{children}</WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
