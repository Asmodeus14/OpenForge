import type { ReactNode } from 'react';
import { CommandPaletteProvider } from '@/components/navigation/CommandPalette';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileTabBar } from '@/components/layout/MobileTabBar';

/**
 * The application shell.
 *
 * A Server Component: it renders no browser state of its own and simply
 * composes the client pieces that do. Route-group scoped, so marketing
 * pages render without it.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      <div className="min-h-dvh">
        <TopBar />

        <div className="flex">
          {/* Sticky rather than fixed, so it scrolls its own overflow
              independently without the main column needing a margin. */}
          <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto border-r border-line lg:block">
            <Sidebar />
          </aside>

          {/* Bottom padding clears the mobile tab bar, which is fixed and
              would otherwise cover the last row of every page. */}
          <main id="main" className="min-w-0 flex-1 pb-14 lg:pb-0">
            {children}
          </main>
        </div>
      </div>

      <MobileTabBar />
    </CommandPaletteProvider>
  );
}
