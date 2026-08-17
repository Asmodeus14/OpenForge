/**
 * Profile metadata — validation and tolerant parsing.
 *
 * The shape itself lives in `chain/profileRegistry.ts` beside the contract
 * that stores its CID. This module holds the rules the interface enforces
 * before anything is pinned or signed.
 *
 * Reading is deliberately forgiving and writing is strict: documents already
 * on IPFS were produced by an older app with a different shape, and refusing
 * to display them would make existing profiles disappear.
 */

import type { ProfileMetadata } from '@/chain/profileRegistry';

export const PROFILE_LIMITS = {
  nameMin: 2,
  nameMax: 60,
  bioMax: 500,
  skillMax: 30,
  skillsMax: 12,
  avatarBytesMax: 5 * 1024 * 1024,
} as const;

export interface ProfileDraft {
  name: string;
  bio: string;
  skills: string[];
}

export function validateProfileDraft(draft: ProfileDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = draft.name.trim();

  if (name.length < PROFILE_LIMITS.nameMin) {
    errors.name = `Use at least ${PROFILE_LIMITS.nameMin} characters.`;
  } else if (name.length > PROFILE_LIMITS.nameMax) {
    errors.name = `Keep this under ${PROFILE_LIMITS.nameMax} characters.`;
  }

  if (draft.bio.trim().length > PROFILE_LIMITS.bioMax) {
    errors.bio = `Keep this under ${PROFILE_LIMITS.bioMax} characters.`;
  }

  if (draft.skills.length > PROFILE_LIMITS.skillsMax) {
    errors.skills = `Use at most ${PROFILE_LIMITS.skillsMax} skills.`;
  }

  return errors;
}

/**
 * Reads a profile document of unknown provenance.
 *
 * Returns `null` only when there is nothing worth showing. A profile with a
 * name and no bio is perfectly valid, and inventing a bio for it — the old
 * app defaulted to the string "Web3 Builder" — attributes words to a person
 * who never wrote them.
 */
export function parseProfileMetadata(value: unknown): ProfileMetadata | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) return null;

  // Historic documents nested the avatar differently, or stored a bare CID.
  let avatar: ProfileMetadata['avatar'];
  if (raw.avatar && typeof raw.avatar === 'object') {
    const cid = (raw.avatar as Record<string, unknown>).cid;
    if (typeof cid === 'string' && cid) avatar = { cid, type: 'avatar' };
  } else if (typeof raw.avatar === 'string' && raw.avatar) {
    avatar = { cid: raw.avatar, type: 'avatar' };
  }

  const optionalString = (key: string): string | undefined => {
    const item = raw[key];
    return typeof item === 'string' && item.trim() ? item.trim() : undefined;
  };

  return {
    type: 'profile',
    version: typeof raw.version === 'string' ? raw.version : '1.0',
    name,
    bio: typeof raw.bio === 'string' ? raw.bio : '',
    skills: Array.isArray(raw.skills)
      ? (raw.skills as unknown[]).filter((s): s is string => typeof s === 'string')
      : [],
    avatar,
    location: optionalString('location'),
    website: optionalString('website'),
    twitter: optionalString('twitter'),
    github: optionalString('github'),
    discord: optionalString('discord'),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : undefined,
  };
}
