import type { LucideIcon } from 'lucide-react';
import {
  Compass,
  FolderGit2,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Wallet,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Appears in the mobile bottom bar, which holds four at most. */
  primary?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * The navigation.
 *
 * Every destination is backed by real data — an on-chain registry or the
 * chat backend. Issues, Roadmap, Contributions, Contributors and Reputation
 * are deliberately absent: none of them exist in the deployed contracts or
 * in the backend, and a permanently empty page behind a nav item is a
 * promise the product cannot keep. Each becomes one line here the moment
 * something real backs it.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/overview', icon: LayoutDashboard, primary: true },
      { label: 'Projects', href: '/projects', icon: FolderGit2, primary: true },
      { label: 'Escrow', href: '/escrow', icon: Wallet, primary: true },
    ],
  },
  {
    label: 'Ecosystem',
    items: [{ label: 'Discover', href: '/discover', icon: Compass, primary: true }],
  },
  {
    label: 'System',
    items: [
      { label: 'Messages', href: '/messages', icon: MessageSquare },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Matches the current pathname to a nav item, including nested routes. */
export function isActivePath(href: string, pathname: string): boolean {
  if (href === pathname) return true;
  return pathname.startsWith(`${href}/`);
}
