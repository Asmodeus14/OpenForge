'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ProfileSeed, ProfileSeedMap } from '@/lib/server/profiles';

/**
 * Carries server-resolved profiles down to `Person`.
 *
 * A server component that already lists addresses can resolve their profiles
 * in the same `Promise.all` it uses for everything else, then wrap the list in
 * this. `useDisplayName` consults it before reaching for react-query, so the
 * names are present in the first paint instead of arriving one gateway fetch
 * at a time and reflowing the layout.
 *
 * Absence of a provider is the normal case, and means exactly what it did
 * before: resolve on the client. So this is additive — no component is
 * required to know about it, and nothing breaks where it is not used.
 */

const ProfileSeedContext = createContext<ProfileSeedMap>({});

export function ProfileSeedProvider({
  seeds,
  children,
}: {
  seeds: ProfileSeedMap;
  children: ReactNode;
}) {
  // Identity-stable across re-renders, so consumers do not re-render because a
  // server component handed down a fresh object literal.
  const value = useMemo(() => seeds, [seeds]);

  return <ProfileSeedContext.Provider value={value}>{children}</ProfileSeedContext.Provider>;
}

/**
 * The seeded profile for an address.
 *
 * Three distinct answers, and the difference matters:
 *   `undefined` — not seeded; the caller should resolve it itself
 *   `null`      — seeded, and this wallet has no profile
 *   `ProfileSeed` — seeded, with a name and possibly an avatar
 */
export function useProfileSeed(address?: string | null): ProfileSeed | null | undefined {
  const seeds = useContext(ProfileSeedContext);
  if (!address) return undefined;

  const key = address.toLowerCase();
  return key in seeds ? seeds[key] : undefined;
}
