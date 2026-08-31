'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { Input, Textarea } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { Alert } from '@/components/ui/States';
import { Divider } from '@/components/ui/Layout';
import { Avatar } from '@/components/ui/Avatar';
import { DisclosureNote } from '@/components/trust/Trust';
import { TransactionFlow } from '@/components/trust/TransactionFlow';
import { queryKeys } from '@/hooks/queries';
import { useTransaction } from '@/hooks/useTransaction';
import { uploadFileToIpfs, uploadJsonToIpfs } from '@/lib/ipfs-upload';
import { ipfsUrl } from '@/lib/ipfs';
import { PROFILE_LIMITS, validateProfileDraft } from '@/lib/profile';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/project';
import {
  buildProfileMetadata,
  createProfile,
  updateProfile,
  type ProfileMetadata,
  type UpdateAvailability,
} from '@/chain/profileRegistry';
import { DEFAULT_CHAIN, PROTOCOL } from '@/chain/config';
import { formatCountdown, formatDate, formatDuration } from '@/lib/format';

/**
 * Create or edit a profile.
 *
 * The contract enforces a 14-day cooldown between edits, with no owner and no
 * override. That is stated here — before the form, before submit, and again
 * in the confirmation dialog — because the previous implementation only
 * revealed it by parsing the revert message after the transaction had already
 * failed and cost gas.
 */
export function ProfileForm({
  account,
  existing,
  availability,
  onDone,
}: {
  account: string;
  existing?: { metadata: ProfileMetadata } | null;
  availability?: UpdateAvailability;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const isUpdate = Boolean(existing);

  const [name, setName] = useState(existing?.metadata.name ?? '');
  const [bio, setBio] = useState(existing?.metadata.bio ?? '');
  const [skills, setSkills] = useState<string[]>(existing?.metadata.skills ?? []);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Blocked only for an edit — a wallet with no profile has no cooldown.
  const blocked = isUpdate && availability !== undefined && !availability.canUpdate;
  const unlocksIn = availability ? formatCountdown(availability.availableAt) : null;

  const tx = useTransaction({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile(account) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileCooldown(account) });
      onDone();
    },
  });

  function onPickAvatar(file: File | null) {
    setErrors((prev) => ({ ...prev, avatar: '' }));
    if (!file) {
      setAvatar(null);
      setAvatarPreview(null);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      setErrors((prev) => ({ ...prev, avatar: 'Use a JPEG, PNG, WebP or GIF image.' }));
      return;
    }
    if (file.size > PROFILE_LIMITS.avatarBytesMax) {
      setErrors((prev) => ({ ...prev, avatar: 'Images must be 5 MB or smaller.' }));
      return;
    }
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function submit() {
    const found = validateProfileDraft({ name, bio, skills });
    setErrors(found);
    if (Object.keys(found).length > 0 || blocked) return;

    let metadataCid = '';

    tx.start({
      title: isUpdate ? 'Update your profile' : 'Create your profile',
      actionLabel: isUpdate ? 'Publish changes' : 'Create profile',
      irreversible: false,
      facts: [
        { label: 'Name', value: name.trim() },
        { label: 'Skills', value: skills.length > 0 ? skills.join(', ') : 'None' },
        { label: 'Avatar', value: avatar ? avatar.name : isUpdate ? 'Unchanged' : 'None' },
        { label: 'Registered to', value: account, mono: true },
        { label: 'Network', value: DEFAULT_CHAIN.label },
      ],
      disclosures: [
        'Your profile is stored on IPFS and referenced on chain. It is public and cannot be deleted.',
        // The single most important thing to say before this button is pressed.
        `After this, the contract will not let you edit your profile again for ${formatDuration(PROTOCOL.profileUpdateCooldownSeconds)}. There is no way to shorten or override that.`,
      ],
      failureReassurance: isUpdate
        ? 'Your profile was not changed, and the edit cooldown has not started.'
        : 'No profile was created.',
      successSummary: isUpdate
        ? 'Your profile has been updated.'
        : 'Your profile is live and linked to your wallet.',
      steps: [
        {
          label: 'Store your profile on IPFS',
          kind: 'sign',
          description: 'Uploads your name, bio, skills and avatar. No wallet prompt.',
          run: async () => {
            const avatarCid = avatar
              ? await uploadFileToIpfs(avatar)
              : existing?.metadata.avatar?.cid;
            metadataCid = await uploadJsonToIpfs(
              buildProfileMetadata({
                name,
                bio,
                skills,
                avatarCid,
                // Preserved so an edit never destroys the original date.
                previousCreatedAt: existing?.metadata.createdAt,
              }),
              `openforge-profile-${account}`,
            );
          },
        },
        {
          label: isUpdate ? 'Record the update on chain' : 'Register your profile on chain',
          kind: 'send',
          description: 'Links the stored document to your wallet address.',
          run: (signer) =>
            isUpdate ? updateProfile(signer, metadataCid) : createProfile(signer, metadataCid),
        },
      ],
    });
  }

  return (
    <>
      {blocked && (
        <Alert tone="warning" title="You cannot edit your profile yet" className="mb-8">
          The contract allows one edit every{' '}
          {formatDuration(PROTOCOL.profileUpdateCooldownSeconds)}. You last edited on{' '}
          {formatDate(availability!.lastUpdated)}, so the next edit becomes possible in{' '}
          {unlocksIn ?? 'a moment'} — on {formatDate(availability!.availableAt)}. There is no
          way to bypass this.
        </Alert>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex flex-col gap-8"
      >
        <fieldset disabled={blocked} className="flex flex-col gap-8 disabled:opacity-60">
          <div className="flex flex-col gap-3">
            <span className="text-secondary font-medium text-fg">Avatar</span>
            <div className="flex items-center gap-5">
              {avatarPreview ? (
                <span className="relative size-24 shrink-0 overflow-hidden rounded-full border border-line">
                  <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" unoptimized />
                </span>
              ) : (
                <Avatar
                  name={name || undefined}
                  address={account}
                  size="xl"
                  src={
                    existing?.metadata.avatar?.cid
                      ? ipfsUrl(existing.metadata.avatar.cid)
                      : undefined
                  }
                />
              )}

              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  {/* A `<span>` rather than a `<button>` because the real
                      control is the file input this label wraps — but it has
                      to *look* like a secondary button, so it takes the shared
                      styles instead of restating them and drifting. */}
                  <span className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                    <ImagePlus className="size-3.5" aria-hidden />
                    {avatar ? 'Choose another' : 'Choose an image'}
                  </span>
                  <input
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    className="sr-only"
                    onChange={(event) => onPickAvatar(event.target.files?.[0] ?? null)}
                  />
                </label>
                {avatar && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    leadingIcon={<X className="size-3.5" aria-hidden />}
                    onClick={() => onPickAvatar(null)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            {errors.avatar && (
              <p role="alert" className="text-meta text-danger-text">
                {errors.avatar}
              </p>
            )}
          </div>

          <Input
            label="Name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
            maxLength={PROFILE_LIMITS.nameMax}
            placeholder="How you want to be known"
          />

          <Textarea
            label="Bio"
            rows={5}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            error={errors.bio}
            maxLength={PROFILE_LIMITS.bioMax}
            showCount
            placeholder="What you work on, and what you are looking for."
          />

          <TagInput
            label="Skills"
            itemLabel="skill"
            tags={skills}
            onChange={setSkills}
            error={errors.skills}
            max={PROFILE_LIMITS.skillsMax}
          />
        </fieldset>

        <DisclosureNote tone="caution">
          Once published, the contract locks your profile for{' '}
          {formatDuration(PROTOCOL.profileUpdateCooldownSeconds)}. Check the spelling of your
          name before you continue — it cannot be corrected until then.
        </DisclosureNote>

        <Divider />

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" size="lg" disabled={blocked}>
            {isUpdate ? 'Review changes' : 'Review and create'}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>

      <TransactionFlow tx={tx} />
    </>
  );
}
