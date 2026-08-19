import Link from 'next/link';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { DEFAULT_CHAIN } from '@/chain/config';

/**
 * Marketing chrome.
 *
 * Deliberately thin. The landing page's job is to explain one idea clearly,
 * and a navigation bar with eight destinations works against that.
 */

function Wordmark() {
  return (
    <Link href="/" aria-label="OpenForge home">
      <Logo />
    </Link>
  );
}

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-line bg-canvas/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-(--container-app) items-center justify-between gap-4 px-5 sm:px-8">
        <Wordmark />
        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link href="/overview" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
            Open the app
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-(--container-app) flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-sm text-meta text-fg-muted">
            An open-source prototype running on {DEFAULT_CHAIN.label}. Not audited, and not
            intended for real funds.
          </p>
        </div>

        {/* Only destinations that exist. The previous footer had ten links
            that all pointed at the same page. */}
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/discover" className="text-meta text-fg-secondary hover:text-fg">
            Discover
          </Link>
          <Link href="/overview" className="text-meta text-fg-secondary hover:text-fg">
            Open the app
          </Link>
          <a
            href={`${DEFAULT_CHAIN.explorer}/address/${DEFAULT_CHAIN.contracts.escrowFactory}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-meta text-fg-secondary hover:text-fg"
          >
            Contracts on Etherscan
          </a>
        </nav>
      </div>
    </footer>
  );
}
