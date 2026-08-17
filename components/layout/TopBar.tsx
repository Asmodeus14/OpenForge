'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { WalletStatus } from '@/components/wallet/WalletStatus';
import { useCommandPalette } from '@/components/navigation/CommandPalette';
import { useIsApplePlatform } from '@/hooks/usePlatform';
import { Sidebar } from './Sidebar';

function Wordmark() {
  return (
    <Link href="/overview" className="rounded-md" aria-label="OpenForge home">
      <Logo />
    </Link>
  );
}

/**
 * Search trigger.
 *
 * Shaped like an input rather than a button, because that is what people
 * look for, and it advertises the shortcut — which is how the palette gets
 * discovered at all.
 */
function SearchTrigger() {
  const palette = useCommandPalette();
  const isMac = useIsApplePlatform();

  return (
    <button
      type="button"
      onClick={palette.open}
      className={cn(
        'group flex h-9 w-full max-w-sm items-center gap-2.5 rounded-md',
        'border border-line bg-subtle px-3',
        'text-secondary text-fg-muted',
        'transition-colors duration-[var(--dur-fast)] hover:border-line-strong hover:text-fg-secondary',
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 text-left">Search</span>
      <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-micro sm:block">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  );
}

export function TopBar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const palette = useCommandPalette();

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-[var(--z-header)] border-b border-line',
          // Translucent, so content scrolling underneath reads as depth
          // rather than the bar floating detached from the page.
          'bg-canvas/80 backdrop-blur-xl backdrop-saturate-150',
        )}
      >
        <div className="flex h-14 items-center gap-3 px-4 sm:px-5">
          <IconButton
            label="Open navigation"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            icon={<Menu className="size-4" aria-hidden />}
          />

          <div className="w-auto lg:w-56 lg:shrink-0">
            <Wordmark />
          </div>

          <div className="hidden flex-1 justify-center sm:flex">
            <SearchTrigger />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <IconButton
              label="Search"
              size="sm"
              className="sm:hidden"
              onClick={palette.open}
              icon={<Search className="size-4" aria-hidden />}
            />
            <ThemeToggle className="hidden sm:inline-flex" />
            <WalletStatus />
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[var(--z-drawer)] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/60"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-canvas">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <Wordmark />
              <IconButton
                label="Close navigation"
                size="sm"
                onClick={() => setMobileNavOpen(false)}
                icon={<X className="size-4" aria-hidden />}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            </div>
            <div className="border-t border-line p-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
