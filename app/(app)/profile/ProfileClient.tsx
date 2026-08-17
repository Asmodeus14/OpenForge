'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Pencil, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Page, PageHeader, Section } from '@/components/ui/Layout';
import { EmptyState, ErrorState, Skeleton, SkeletonText } from '@/components/ui/States';
import { DisclosureNote, TechnicalDetails } from '@/components/trust/Trust';
import { ProfileView } from '@/components/profile/ProfileView';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import { useProfile, useProfileCooldown } from '@/hooks/queries';
import { PROTOCOL } from '@/chain/config';
import { formatCountdown, formatDuration } from '@/lib/format';

/**
 * Your own profile.
 *
 * View and edit live on one route rather than two, because a profile is small
 * enough that a separate edit page would be mostly whitespace and one more
 * navigation between deciding to change something and changing it.
 */
export function ProfileClient() {
  const wallet = useWalletContext();
  const profile = useProfile(wallet.account);
  const cooldown = useProfileCooldown(wallet.account);
  const [editing, setEditing] = useState(false);

  if (!wallet.account) {
    return (
      <Page width="content">
        <PageHeader title="Profile" description="Your public identity on OpenForge." />
        <div className="border-t border-line">
          <EmptyState
            icon={<Wallet className="size-5" aria-hidden />}
            title="Connect a wallet to see your profile"
            description="A profile is registered against a wallet address, so one has to be connected before it can be read or created."
            action={
              <Button
                variant="primary"
                onClick={wallet.connect}
                loading={wallet.isConnecting}
                leadingIcon={<Wallet className="size-4" aria-hidden />}
              >
                Connect wallet
              </Button>
            }
          />
        </div>
      </Page>
    );
  }

  if (profile.isPending) {
    return (
      <Page width="content">
        <PageHeader title="Profile" />
        <div className="flex flex-col gap-6 border-t border-line py-10">
          <Skeleton className="size-24 rounded-full" />
          <SkeletonText lines={3} />
        </div>
      </Page>
    );
  }

  if (profile.isError) {
    return (
      <Page width="content">
        <PageHeader title="Profile" />
        <div className="border-t border-line py-10">
          <ErrorState
            error={profile.error}
            context="Your profile could not be loaded"
            onRetry={() => void profile.refetch()}
          />
        </div>
      </Page>
    );
  }

  /* ------------------------------------------------------ create or edit */

  if (editing || !profile.data) {
    return (
      <Page width="content">
        <PageHeader
          title={profile.data ? 'Edit your profile' : 'Create your profile'}
          description={
            profile.data
              ? 'Changes are stored on IPFS and recorded on chain.'
              : 'A profile links your wallet to a name, a bio and what you work on. It is public.'
          }
        />
        <div className="border-t border-line py-10">
          <ProfileForm
            account={wallet.account}
            existing={profile.data}
            availability={cooldown.data}
            onDone={() => setEditing(false)}
          />
        </div>
      </Page>
    );
  }

  /* ------------------------------------------------------------- display */

  const canEdit = cooldown.data?.canUpdate ?? false;
  const unlocksIn = cooldown.data ? formatCountdown(cooldown.data.availableAt) : null;

  return (
    <Page width="content">
      <PageHeader
        title="Profile"
        description="How your wallet appears to everyone else on OpenForge."
        actions={
          <Button
            variant="secondary"
            disabled={!canEdit}
            onClick={() => setEditing(true)}
            leadingIcon={<Pencil className="size-4" aria-hidden />}
          >
            {canEdit ? 'Edit profile' : `Editable in ${unlocksIn ?? 'a moment'}`}
          </Button>
        }
      />

      <div className="border-t border-line py-10">
        <ProfileView
          address={wallet.account}
          metadata={profile.data.metadata}
          avatarUrl={profile.data.avatarUrl}
        />
      </div>

      {!canEdit && (
        <DisclosureNote>
          The contract permits one profile edit every{' '}
          {formatDuration(PROTOCOL.profileUpdateCooldownSeconds)}. Yours becomes editable
          again in {unlocksIn ?? 'a moment'}.
        </DisclosureNote>
      )}

      <Section title="Public link" className="mt-2">
        <p className="text-body text-fg-secondary">
          Anyone can view this profile without connecting a wallet.
        </p>
        <Link
          href={`/profile/${wallet.account}`}
          className="mt-3 inline-block break-all font-mono text-code text-accent-text hover:underline underline-offset-4"
        >
          /profile/{wallet.account}
        </Link>
      </Section>

      <div className="pb-12">
        <TechnicalDetails summary="Where this is stored">
          <dl className="flex flex-col gap-4 text-secondary">
            <div>
              <dt className="text-meta text-fg-muted">IPFS content identifier</dt>
              <dd className="mt-1 break-all font-mono text-code text-fg-secondary">
                {profile.data.cid}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-fg-muted">Profile registry</dt>
              <dd className="mt-1 text-fg-secondary">
                Only the CID above is stored on chain. The document itself lives on IPFS and
                is served by whichever gateway responds first.
              </dd>
            </div>
          </dl>
        </TechnicalDetails>
      </div>
    </Page>
  );
}
