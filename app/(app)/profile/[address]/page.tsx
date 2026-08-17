import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isAddress } from 'ethers';
import { UserX } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/States';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { ProfileView } from '@/components/profile/ProfileView';
import { loadProfile } from '@/lib/server/profiles';
import { shortenAddress } from '@/lib/format';

/**
 * A public profile.
 *
 * Rendered on the server and revalidated periodically. Profiles change at
 * most once every 14 days — the contract will not permit more — so caching
 * for a few minutes costs nothing in freshness and saves an RPC call and an
 * IPFS fetch on every view.
 *
 * Deliberately has no `loading.tsx`. A loading file makes Next stream the
 * response, which flushes a 200 status before this component runs, so the
 * `notFound()` below renders the 404 page with a 200 status code. A profile
 * URL is something people share, and a soft 404 is both wrong for crawlers
 * and wrong for anyone checking a link programmatically. Measured and
 * verified — do not add one back.
 */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  if (!isAddress(address)) return { title: 'Profile' };

  // Failing to load metadata must not fail the page, so a lookup error
  // degrades to the address rather than throwing during metadata generation.
  const profile = await loadProfile(address).catch(() => null);
  return {
    title: profile ? profile.metadata.name : `Profile ${shortenAddress(address)}`,
    description: profile?.metadata.bio || 'An OpenForge profile.',
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  if (!isAddress(address)) notFound();

  const profile = await loadProfile(address).catch(() => null);

  if (!profile) {
    return (
      <Page width="content">
        <PageHeader title="Profile" eyebrow={shortenAddress(address, 6)} />
        <div className="border-t border-line">
          <EmptyState
            icon={<UserX className="size-5" aria-hidden />}
            title="This wallet has no profile"
            description="Nobody has registered a profile against this address, or its stored details could not be retrieved from IPFS."
            action={
              <Link href="/discover" className={buttonClasses()}>
                Browse projects
              </Link>
            }
          />
        </div>
      </Page>
    );
  }

  return (
    <Page width="content">
      <div className="py-10">
        <ProfileView
          address={profile.address}
          metadata={profile.metadata}
          avatarUrl={profile.avatarUrl}
        />
      </div>
    </Page>
  );
}
