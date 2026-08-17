import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LogOut, TriangleAlert, User, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, Button } from '../design/primitives';
import { AddressDisplay } from '../design/primitives/Trust';
import { cn } from '../design/cn';
import { DEFAULT_CHAIN } from '../chain/config';
import { useProfile } from '../hooks/queries';
import { shortenAddress } from '../lib/format';
import { useWalletContext } from './WalletProvider';

/**
 * Wallet state in the shell.
 *
 * Deliberately explicit about which of the four wallet situations the user is
 * in — no wallet installed, disconnected, wrong network, connected — because
 * conflating them is how people end up confused about why an action failed.
 */
export function WalletStatus({ collapsed }: { collapsed?: boolean }) {
  const wallet = useWalletContext();
  const { data: profile } = useProfile(wallet.account);

  if (!wallet.installed) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          'flex items-center gap-2 rounded-md border border-line px-3 py-2',
          'text-meta text-fg-muted transition-colors duration-[var(--dur-hover)] hover:border-line-strong hover:text-fg',
        )}
      >
        <Wallet className="size-4 shrink-0" aria-hidden />
        {!collapsed && <span>Install a wallet</span>}
      </a>
    );
  }

  if (!wallet.account) {
    return (
      <Button
        variant="secondary"
        size="sm"
        fullWidth={!collapsed}
        loading={wallet.isConnecting}
        onClick={wallet.connect}
        leadingIcon={<Wallet className="size-4" aria-hidden />}
      >
        {!collapsed && 'Connect wallet'}
      </Button>
    );
  }

  if (wallet.wrongNetwork) {
    return (
      <Button
        variant="secondary"
        size="sm"
        fullWidth={!collapsed}
        onClick={wallet.switchNetwork}
        leadingIcon={<TriangleAlert className="size-4 text-warning-text" aria-hidden />}
        className="border-warning-line"
      >
        {!collapsed && `Switch to ${DEFAULT_CHAIN.name}`}
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
            'flex w-full items-center gap-2 rounded-md border border-line px-2 py-1.5',
            'text-left transition-colors duration-[var(--dur-hover)] hover:bg-raised hover:border-line-strong',
          )}
        >
          <Avatar
            src={profile?.avatarUrl}
            name={name}
            address={wallet.account}
            size="sm"
          />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-meta text-fg">
                  {name ?? shortenAddress(wallet.account)}
                </span>
                {name && (
                  <span className="block truncate font-mono text-[11px] text-fg-subtle">
                    {shortenAddress(wallet.account)}
                  </span>
                )}
              </span>
              <ChevronDown className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={6}
          className={cn(
            'z-50 min-w-56 rounded-lg border border-line bg-raised p-1',
            'shadow-[var(--shadow-popover)]',
            'data-[state=open]:animate-[of-fade-in_var(--dur-menu)_var(--ease-out)]',
          )}
        >
          <div className="px-2 py-2">
            <p className="text-meta text-fg-subtle">Connected wallet</p>
            <AddressDisplay
              address={wallet.account}
              chars={6}
              className="mt-1"
            />
            <p className="mt-2 text-meta text-fg-subtle">
              {DEFAULT_CHAIN.label} · test funds only
            </p>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          <DropdownMenu.Item asChild>
            <Link
              to="/profile"
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-secondary text-fg-muted outline-none data-[highlighted]:bg-surface data-[highlighted]:text-fg"
            >
              <User className="size-4" aria-hidden />
              {profile ? 'Your profile' : 'Create a profile'}
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={wallet.disconnect}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-secondary text-fg-muted outline-none data-[highlighted]:bg-surface data-[highlighted]:text-fg"
          >
            <LogOut className="size-4" aria-hidden />
            Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
