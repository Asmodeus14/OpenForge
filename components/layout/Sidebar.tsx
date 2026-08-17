'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { NAV_GROUPS, isActivePath } from '@/lib/navigation';

/**
 * Primary navigation.
 *
 * Deliberately quiet: small icons, no filled pills, no accent unless a row
 * is active. The content should dominate the screen, not the chrome.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-7 px-3 py-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <h2 className="px-2.5 pb-2 text-micro font-medium uppercase tracking-wide text-fg-muted">
            {group.label}
          </h2>

          {group.items.map((item) => {
            const active = isActivePath(item.href, pathname);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5',
                  'text-secondary transition-colors duration-[var(--dur-fast)]',
                  active
                    ? 'bg-subtle font-medium text-fg'
                    : 'text-fg-secondary hover:bg-subtle hover:text-fg',
                )}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    active ? 'text-accent' : 'text-fg-muted group-hover:text-fg-secondary',
                  )}
                  aria-hidden
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
