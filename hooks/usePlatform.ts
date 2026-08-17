'use client';

import { useSyncExternalStore } from 'react';

/** The value never changes after load, so there is nothing to subscribe to. */
const noopSubscribe = () => () => {};

/**
 * Whether the user is on an Apple platform, used to show ⌘ rather than Ctrl
 * in keyboard hints.
 *
 * `useSyncExternalStore` rather than an effect: the server genuinely cannot
 * know the platform, and this is exactly the case it exists for — a distinct
 * server snapshot, resolved on hydration without a mismatch and without a
 * cascading render.
 */
export function useIsApplePlatform(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad|iPod/.test(navigator.userAgent),
    () => false,
  );
}
