'use client';

import { Avatar } from '@/components/ui/Avatar';
import { AddressDisplay } from '@/components/trust/Trust';
import { useProfile } from '@/hooks/queries';
import { useProfileSeed } from '@/components/trust/ProfileSeed';
import { cn } from '@/lib/cn';
import { shortenAddress } from '@/lib/format';

/**
 * People, rendered as people.
 *
 * A wallet address is the only identifier this product can rely on, but it is
 * unreadable — two escrows and a conversation all showing `0x8E13…799f` give a
 * user nothing to recognise. Every address that refers to a *person* therefore
 * resolves through the profile registry to the name they registered.
 *
 * The rule that keeps this honest: **a name never replaces the address where
 * identity matters.** A profile name is self-asserted — the registry proves
 * only that this wallet paid to register that string, and anyone may register
 * any string, including someone else's. So `Person` renders both, and
 * `PersonName` (name only) is for prose where the address is already on screen
 * beside it. Anywhere money is being committed — the recipient field, the
 * proposal card, the escrow's parties — uses `Person`.
 *
 * Resolution is a react-query lookup keyed on the address, so a transcript with
 * forty messages from two people costs two requests, not forty.
 */

export interface DisplayName {
  /** The registered profile name, or null if this wallet has no profile. */
  name: string | null;
  avatarUrl?: string;
  /** Name if there is one, otherwise a shortened address. Never empty. */
  label: string;
  isLoading: boolean;
}

export function useDisplayName(address?: string | null, chars = 4): DisplayName {
  // A server render may already have resolved this address, in which case the
  // name is known before the first paint and there is nothing to fetch.
  const seed = useProfileSeed(address);
  const seeded = seed !== undefined;

  const profile = useProfile(address, { enabled: !seeded });

  if (seeded) {
    return {
      name: seed?.name ?? null,
      avatarUrl: seed?.avatarUrl,
      label: seed?.name ?? shortenAddress(address, chars),
      isLoading: false,
    };
  }

  const name = profile.data?.metadata.name?.trim() || null;

  return {
    name,
    avatarUrl: profile.data?.avatarUrl,
    label: name ?? shortenAddress(address, chars),
    isLoading: profile.isLoading,
  };
}

/**
 * A name on its own, for running text.
 *
 * The full address stays in the `title` and in the accessible label, so the
 * underlying identity is never more than a hover away even here.
 */
export function PersonName({
  address,
  chars = 4,
  className,
}: {
  address?: string | null;
  chars?: number;
  className?: string;
}) {
  const { name } = useDisplayName(address, chars);

  if (!address) return null;

  return (
    <span
      className={cn(name && 'text-fg', className)}
      title={name ? `${name} — ${address}` : address}
    >
      {name ?? shortenAddress(address, chars)}
    </span>
  );
}

/**
 * Name *and* address together — the form used wherever the answer to "who is
 * this" has consequences.
 */
export function Person({
  address,
  chars = 4,
  showCopy = true,
  showExplorer = true,
  className,
}: {
  address: string;
  chars?: number;
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
}) {
  const { name } = useDisplayName(address, chars);

  return (
    <AddressDisplay
      address={address}
      name={name ?? undefined}
      chars={chars}
      showCopy={showCopy}
      showExplorer={showExplorer}
      className={className}
    />
  );
}

/**
 * Avatar, name and address as one block, for list rows and message headers.
 */
export function PersonRow({
  address,
  size = 'sm',
  you = false,
  trailing,
  className,
}: {
  address: string;
  size?: 'xs' | 'sm' | 'md';
  /** Marks the connected wallet, so a user can find themselves in a thread. */
  you?: boolean;
  trailing?: React.ReactNode;
  className?: string;
}) {
  const { name, avatarUrl } = useDisplayName(address);

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <Avatar src={avatarUrl} name={name ?? undefined} address={address} size={size} />
      <span className="truncate text-secondary font-medium text-fg">
        {name ?? shortenAddress(address, 4)}
      </span>
      {/* Kept beside the name rather than instead of it: the name is claimed,
          the address is proof. */}
      {name && (
        <span className="shrink-0 font-mono text-micro text-fg-muted" title={address}>
          {shortenAddress(address, 4)}
        </span>
      )}
      {you && <span className="shrink-0 text-micro text-accent-text">You</span>}
      {trailing}
    </span>
  );
}
