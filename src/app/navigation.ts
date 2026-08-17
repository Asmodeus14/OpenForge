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
  path: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar. Space there is limited to four. */
  primary?: boolean;
  /** Requires a connected wallet to be meaningful. */
  requiresWallet?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * The navigation.
 *
 * Every destination here is backed by real data — an on-chain registry or the
 * chat backend. Surfaces from the original brief that have no implementation
 * anywhere in the system (Issues, Roadmap, Contributions, Reputation,
 * Contributors, Transactions, Discussions, Notifications) are deliberately
 * absent rather than shipped as empty shells, because a navigation item that
 * leads nowhere is itself a broken promise.
 *
 * They can be added the moment there is something real behind them.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      {
        label: 'Overview',
        path: '/overview',
        icon: LayoutDashboard,
        primary: true,
        requiresWallet: true,
      },
      { label: 'Projects', path: '/projects', icon: FolderGit2, primary: true },
      { label: 'Escrow', path: '/escrow', icon: Wallet, primary: true, requiresWallet: true },
    ],
  },
  {
    label: 'Ecosystem',
    items: [{ label: 'Discover', path: '/discover', icon: Compass, primary: true }],
  },
  {
    label: 'Communication',
    items: [{ label: 'Messages', path: '/messages', icon: MessageSquare }],
  },
  {
    label: 'System',
    items: [{ label: 'Settings', path: '/settings', icon: Settings }],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);
