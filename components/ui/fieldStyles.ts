import { cn } from '@/lib/cn';

/**
 * The shared appearance of every text-entry surface.
 *
 * In a module with no `'use client'` directive, for the same reason
 * `buttonStyles.ts` is: anything exported from a Client Component is
 * unreachable from the server, and a style constant should not be the thing
 * that forces a page to become a client boundary.
 *
 * This existed as a private const inside `Input.tsx`, which meant the two text
 * areas outside that file — the message composer and the inline message editor
 * — had to restate it from memory. Both had already drifted: neither carried
 * the shadow or the transition, and neither lit its border on hover, so a chat
 * input sat visibly flatter than the identical control on a form two clicks
 * away.
 */
export const FIELD = cn(
  // `lg` to match the controls beside it. A field and a button sitting on the
  // same row with different corner radii is the sort of mismatch nobody names
  // but everybody sees.
  'w-full rounded-lg bg-surface text-fg placeholder:text-fg-muted',
  'border border-line shadow-[var(--shadow-sm)]',
  'transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]',
  'hover:border-line-strong',
  // A ring rather than a thicker border, so focus never shifts layout.
  'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-subtle',
  'disabled:cursor-not-allowed disabled:opacity-50',
);
