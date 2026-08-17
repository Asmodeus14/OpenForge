'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Link from 'next/link';
import { ChevronDown, LogOut, TriangleAlert, User, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AddressDisplay } from '@/components/trust/Trust';
import { DEFAULT_CHAIN } from '@/chain/config';
import { useProfile } from '@/hooks/queries';
import { shortenAddress } from '@/lib/format';
import { useWalletContext } from './WalletProvider';

/**
 * Wallet state in the top bar.
 *
 * Explicit about which of four situations the user is in — no wallet
 * installed, disconnected, wrong network, connected. Collapsing those into
 * one ambiguous button is how people end up not understanding why an action
 * failed.
 */
export function WalletStatus() {
  const wallet = useWalletContext();
  const { data: profile } = useProfile(wallet.account);

  if (!wallet.installed) {
    return (
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer')
        }
        leadingIcon={<Wallet className="size-4" aria-hidden />}
      >
        Install a wallet
      </Button>
    );
  }

  if (!wallet.account) {
    return (
      <Button
        size="sm"
        variant="primary"
        loading={wallet.isConnecting}
        onClick={wallet.connect}
        leadingIcon={<Wallet className="size-4" aria-hidden />}
      >
        Connect wallet
      </Button>
    );
  }

  if (wallet.wrongNetwork) {
    return (
      <Button
        size="sm"
        variant="secondary"
        onClick={wallet.switchNetwork}
        className="border-warning-line"
        leadingIcon={<TriangleAlert className="size-4 text-warning-text" aria-hidden />}
      >
        Switch to {DEFAULT_CHAIN.name}
      </Button>
    );
  }

  const name = profile?.metadata.name;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-md py-1 pl-1 pr-2',
            'transition-colors duration-[var(--dur-fast)] hover:bg-subtle',
          )}
        >
          <Avatar src={profile?.avatarUrl} name={name} address={wallet.account} size="sm" />
          <span className="hidden text-secondary text-fg sm:block">
            {name ?? shortenAddress(wallet.account)}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-fg-muted" aria-hidden />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-[var(--z-overlay)] min-w-64 rounded-lg border border-line bg-elevated p-1.5',
            'shadow-[var(--shadow-lg)]',
            'data-[state=open]:animate-[of-drop-in_var(--dur-fast)_var(--ease-out)]',
          )}
        >
          <div className="px-2.5 py-2">
            <p className="text-micro uppercase tracking-wide text-fg-muted">
              Connected wallet
            </p>
            <AddressDisplay address={wallet.account} chars={6} className="mt-1.5" />
            {/* Stated permanently, not buried in a settings page. */}
            <p className="mt-2.5 text-meta text-fg-muted">
              {DEFAULT_CHAIN.label} — test funds only
            </p>
          </div>

          <DropdownMenu.Separator className="my-1.5 h-px bg-line" />

          <DropdownMenu.Item asChild>
            <Link
              href="/profile"
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-secondary text-fg-secondary outline-none data-[highlighted]:bg-subtle data-[highlighted]:text-fg"
            >
              <User className="size-4" aria-hidden />
              {profile ? 'Your profile' : 'Create a profile'}
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={wallet.disconnect}
            className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-secondary text-fg-secondary outline-none data-[highlighted]:bg-subtle data-[highlighted]:text-fg"
          >
            <LogOut className="size-4" aria-hidden />
            Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
