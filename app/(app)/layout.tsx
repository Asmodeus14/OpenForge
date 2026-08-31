import type { ReactNode } from 'react';
import { CommandPaletteProvider } from '@/components/navigation/CommandPalette';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import { Environment } from '@/components/marketing/environment/Environment';

/**
 * The application shell.
 *
 * A Server Component: it renders no browser state of its own and simply
 * composes the client pieces that do. Route-group scoped, so marketing pages
 * render without it.
 *
 * The environment runs behind the whole application, not just the landing
 * page — same component, same phase, so the product is the same place at the
 * same time of day as the site that introduced it. It is fixed and dimmed:
 * fixed because a sky that scrolls away leaves the glass with nothing to
 * refract halfway down a page, dimmed because every panel above it carries
 * figures someone is about to act on.
 *
 * Terrain is off here. A mountain range behind a milestone ledger is scenery
 * arguing with data.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      <Environment
        className="fixed -z-10"
        terrain={false}
        intensity={0.5}
      />

      <div className="min-h-dvh">
        <TopBar />

        <div className="flex">
          {/* A floating pane rather than a flush rail. Inset on all sides so
              the sky passes behind and around it, which is what makes it read
              as sitting on the environment rather than as a second page
              stitched to the edge of the first.

              Sticky rather than fixed, so it scrolls its own overflow
              independently without the main column needing a margin. */}
          <aside className="sticky top-14 z-[var(--z-sticky)] hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 p-3 lg:block">
            <div className="of-glass-panel h-full overflow-y-auto rounded-2xl">
              <Sidebar />
            </div>
          </aside>

          {/* Bottom padding clears the mobile tab bar, which is fixed and
              would otherwise cover the last row of every page.

              The bar is `h-14` *plus* `env(safe-area-inset-bottom)`, so a flat
              `pb-14` was short by the inset on exactly the devices that have
              one — the last row sat under the bar on every notched phone. The
              two have to be added, not assumed equal. */}
          <main
            id="main"
            className="min-w-0 flex-1 pb-[calc(3.5rem_+_env(safe-area-inset-bottom))] lg:pb-0"
          >
            {children}
          </main>
        </div>
      </div>

      <MobileTabBar />
    </CommandPaletteProvider>
  );
}
