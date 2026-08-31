'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import { Toaster } from '@/components/ui/Toaster';

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
            // Returning to the tab refetches anything past the stale window.
            //
            // This was off, on the theory that it caused flicker. It does not:
            // react-query keeps the previous data on screen while refetching,
            // so the only visible change is a value updating. What it did
            // cause was a product where the counterparty released a milestone
            // and you had to reload the page to find out.
            refetchOnWindowFocus: true,
            // Same argument, for a connection that dropped and came back.
            refetchOnReconnect: true,
            // Under this, a focus event counts as continuous use rather than
            // as a return, so alt-tabbing does not hammer the RPC.
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
        {/* Inside ThemeProvider so it can read the resolved theme, outside
            WalletProvider because nothing it shows depends on a connection. */}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
