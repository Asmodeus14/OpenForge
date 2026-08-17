'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { NAV_ITEMS, isActivePath } from '@/lib/navigation';

/**
 * Mobile tab bar.
 *
 * The four destinations marked `primary` in the navigation, one tap away.
 * The drawer still holds everything, but reaching Projects should not require
 * opening a menu first on the device where menus are most expensive.
 *
 * Sits above the home indicator via `env(safe-area-inset-bottom)`, so the
 * last row of content is not obscured on notched phones.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.primary);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-line lg:hidden',
        'bg-canvas/90 backdrop-blur-xl backdrop-saturate-150',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <ul className="flex">
        {items.map((item) => {
          const active = isActivePath(item.href, pathname);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1',
                  'text-micro transition-colors duration-[var(--dur-fast)]',
                  active ? 'text-fg' : 'text-fg-muted',
                )}
              >
                <Icon
                  className={cn('size-5', active && 'text-accent')}
                  aria-hidden
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
