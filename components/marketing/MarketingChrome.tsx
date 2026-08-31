import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { DEFAULT_CHAIN } from '@/chain/config';

/**
 * The marketing footer.
 *
 * This file also held `MarketingHeader`, a full-width bordered bar. The
 * redesign replaced it with `sections/MarketingNav` — a floating glass pill
 * the sky runs behind — and the old header sat here unimported afterwards,
 * carrying the last hand-written `bg-canvas/80 backdrop-blur` in the codebase.
 */

function Wordmark() {
  return (
    <Link href="/" aria-label="OpenForge home">
      <Logo />
    </Link>
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
