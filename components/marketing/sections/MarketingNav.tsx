import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { GithubMark } from '@/components/ui/BrandIcons';
import { SkyToggle } from '@/components/marketing/environment/SkyToggle';
import { cn } from '@/lib/cn';

/**
 * A floating pill nav rather than a full-width bar.
 *
 * Detaching it from the top edge is what lets the sky run behind and above it,
 * and the environment is the first thing this page is trying to show. A bar
 * pinned edge-to-edge would cut the sky off at a hard line and make it read as
 * a header image sitting under chrome.
 *
 * Translucent, and it stays translucent: the content scrolling beneath is the
 * hierarchy cue. Only three destinations, all of which exist — the reference
 * carries six, but five of them would be links to pages this project does not
 * have.
 */

const LINKS = [
  { href: '/discover', label: 'Discover' },
  { href: '/funding', label: 'Funding' },
  { href: '/design', label: 'Design system' },
];

export function MarketingNav() {
  return (
    <div className="sticky top-0 z-[var(--z-header)] px-4 pt-4 sm:px-6 sm:pt-5">
      <nav
        aria-label="Main"
        className={cn(
          'of-glass of-glass-thick',
          'mx-auto flex h-14 max-w-(--container-app) items-center gap-4 rounded-full px-3 sm:px-4',
        )}
      >
        <Link
          href="/"
          aria-label="OpenForge home"
          className="shrink-0 rounded-full pl-1.5 pr-1"
        >
          <Logo />
        </Link>

        <ul className="ml-2 hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-3 py-1.5 text-secondary text-fg-secondary transition-colors duration-[var(--dur-fast)] hover:bg-subtle hover:text-fg"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <SkyToggle className="hidden sm:inline-flex" />

          {/* No star count. The reference shows "12.4k"; this repository's real
              figure is not known at build time, and inventing one is precisely
              the fabricated social proof the landing page exists without. */}
          <a
            href="https://github.com/Asmodeus14/OpenForge"
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-full border border-line px-3.5',
              'text-secondary font-medium text-fg-secondary',
              'transition-colors duration-[var(--dur-fast)] hover:border-line-strong hover:text-fg',
            )}
          >
            <GithubMark className="size-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <Link
            href="/overview"
            className={cn(
              'of-btn-primary inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4',
              'text-secondary font-medium text-fg-on-accent',
              'transition-[background-image,transform,box-shadow]',
              'duration-[var(--dur-fast)] ease-[var(--ease-out)] active:scale-[0.98]',
            )}
          >
            Get started
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </nav>
    </div>
  );
}
