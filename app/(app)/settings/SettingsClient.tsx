'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, LogOut, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { Page, PageHeader, Section } from '@/components/ui/Layout';
import { Alert } from '@/components/ui/States';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AddressDisplay, DisclosureNote, NetworkBadge } from '@/components/trust/Trust';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import { useProfile } from '@/hooks/queries';
import { DEFAULT_CHAIN, PROTOCOL } from '@/chain/config';
import { formatDuration } from '@/lib/format';

/**
 * Settings.
 *
 * Only settings that actually do something. The previous version rendered a
 * full page of switches with no handlers, no persistence, and a footer that
 * read "Settings are automatically saved" — nothing on it saved anything.
 *
 * A row appears here when there is real state behind it. Anything else
 * belongs on the page it affects, or nowhere.
 */

/** Storage this app writes. Listed explicitly so "clear" clears exactly it. */
const OWNED_STORAGE_KEYS = [
  'openforge:theme',
  'openforge:wallet-disconnected',
  'openforge:palette-recents',
];

function Row({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6 border-t border-line py-6 first:border-t-0 first:pt-0">
      <div className="min-w-0 max-w-lg">
        <p className="text-body text-fg">{title}</p>
        <p className="mt-1 text-secondary text-fg-secondary">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function SettingsClient() {
  const wallet = useWalletContext();
  const { data: profile } = useProfile(wallet.account);
  const queryClient = useQueryClient();
  const [cleared, setCleared] = useState(false);

  function clearLocalData() {
    for (const key of OWNED_STORAGE_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Private mode. Nothing was stored, so nothing needs removing.
      }
    }
    queryClient.clear();
    setCleared(true);
  }

  return (
    <Page width="content">
      <PageHeader
        title="Settings"
        description="Preferences stored in this browser, and the wallet this app is connected to."
      />

      <Section title="Appearance">
        <Row
          title="Colour theme"
          description="Follows your system setting unless you choose otherwise. Saved in this browser."
          control={<ThemeToggle />}
        />
      </Section>

      <Section title="Wallet">
        {wallet.account ? (
          <>
            <Row
              title="Connected wallet"
              description="All projects, escrows and profiles are registered against this address."
              control={<AddressDisplay address={wallet.account} chars={6} />}
            />
            <Row
              title="Network"
              description={`OpenForge is deployed only to ${DEFAULT_CHAIN.label}. Tokens here have no monetary value.`}
              control={<NetworkBadge chainId={wallet.chainId} />}
            />
            <Row
              title="Profile"
              description={
                profile
                  ? `Published as “${profile.metadata.name}”. Editable once every ${formatDuration(PROTOCOL.profileUpdateCooldownSeconds)}.`
                  : 'You have not created a profile. Without one, other people see only your wallet address.'
              }
              control={
                <Link href="/profile" className={buttonClasses({ size: 'sm' })}>
                  {profile ? 'View profile' : 'Create profile'}
                </Link>
              }
            />
            <Row
              title="Disconnect"
              description="Clears the connection in this browser. A site cannot revoke its own access, so you may also want to disconnect from inside your wallet."
              control={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={wallet.disconnect}
                  leadingIcon={<LogOut className="size-3.5" aria-hidden />}
                >
                  Disconnect
                </Button>
              }
            />
          </>
        ) : (
          <Alert tone="info" title="No wallet connected">
            Connect a wallet to see the address this app is acting as, and the network it is
            on.
          </Alert>
        )}

        {wallet.wrongNetwork && (
          <Alert
            tone="warning"
            title="Wrong network"
            className="mt-6"
            icon={<TriangleAlert className="size-4 text-warning-text" aria-hidden />}
          >
            Your wallet is on a network OpenForge is not deployed to. Nothing on this site
            will load until you switch to {DEFAULT_CHAIN.label}.
            <Button size="sm" variant="secondary" className="mt-3" onClick={wallet.switchNetwork}>
              Switch to {DEFAULT_CHAIN.name}
            </Button>
          </Alert>
        )}
      </Section>

      <Section title="Local data">
        <Row
          title="Clear cached data"
          description="Removes your theme preference, recent searches and the cached chain data held in this browser. Nothing on chain or on IPFS is affected — none of it can be deleted."
          control={
            <Button
              size="sm"
              variant="secondary"
              onClick={clearLocalData}
              leadingIcon={
                cleared ? (
                  <Check className="size-3.5 text-success-text" aria-hidden />
                ) : (
                  <RefreshCw className="size-3.5" aria-hidden />
                )
              }
            >
              {cleared ? 'Cleared' : 'Clear'}
            </Button>
          }
        />

        <DisclosureNote className="mt-6">
          OpenForge has no account system and no server-side profile of you. Everything it
          knows is either public on chain, public on IPFS, or held in this browser.
        </DisclosureNote>
      </Section>

      <div className="pb-16" />
    </Page>
  );
}
