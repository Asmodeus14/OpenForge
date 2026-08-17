import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { AddressDisplay } from '@/components/trust/Trust';
import { formatDate } from '@/lib/format';
import type { ProfileMetadata } from '@/chain/profileRegistry';

/**
 * A profile, as displayed.
 *
 * Every field here comes from the document the person actually published.
 * Nothing is defaulted: no invented job title, no placeholder bio, no
 * fabricated statistics. A profile with only a name renders as a profile with
 * only a name, which is the truth about that profile.
 *
 * A Server Component, so a public profile is rendered on the server and is
 * indexable and readable without JavaScript.
 */
export function ProfileView({
  address,
  metadata,
  avatarUrl,
}: {
  address: string;
  metadata: ProfileMetadata;
  avatarUrl?: string;
}) {
  const joined = formatDate(metadata.createdAt);
  const edited = formatDate(metadata.updatedAt);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
        <Avatar src={avatarUrl} name={metadata.name} address={address} size="xl" />

        <div className="min-w-0 flex-1">
          <h1 className="text-title text-fg">{metadata.name}</h1>

          <div className="mt-3">
            <AddressDisplay address={address} chars={6} />
          </div>

          {(joined || edited) && (
            <p className="mt-3 text-meta text-fg-muted">
              {joined && <>Profile created {joined}</>}
              {joined && edited && ' · '}
              {edited && <>last edited {edited}</>}
            </p>
          )}
        </div>
      </div>

      {metadata.bio && (
        <p className="max-w-2xl whitespace-pre-line text-body text-fg-secondary">
          {metadata.bio}
        </p>
      )}

      {metadata.skills.length > 0 && (
        <div>
          <h2 className="text-meta text-fg-muted">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {metadata.skills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
