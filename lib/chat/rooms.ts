import * as chat from './api';
import type { ChatRoom } from './types';
import { shortenAddress } from '@/lib/format';

/**
 * One conversation per pair of wallets.
 *
 * Escrow work generates several reasons for the same two people to talk — the
 * proposed terms, the signature, the escrow going live, a dispute weeks later.
 * Giving each of those its own room fragments the history exactly where it is
 * most useful to have it in one place: a dispute is argued using what was
 * agreed, and the agreement was in the other room.
 *
 * So there is one room per pair, keyed on both addresses. The key goes in the
 * server's `context` column, which it stores and returns without interpreting,
 * and is sorted so both parties compute the same value regardless of who
 * creates it first or which of them is the funder.
 *
 * `context` replaced matching rooms by display name. That failed silently and
 * badly: renaming a room orphaned it, and the next lookup created a duplicate
 * rather than reporting anything.
 */

export const PAIR_CONTEXT_PREFIX = 'pair:';

export function pairRoomContext(a: string, b: string): string {
  // Sorted, so `pair(funder, developer)` and `pair(developer, funder)` are the
  // same room. Lowercased because the same address arrives in several casings
  // depending on which contract call or chat payload produced it.
  const [first, second] = [a.toLowerCase(), b.toLowerCase()].sort();
  return `${PAIR_CONTEXT_PREFIX}${first}:${second}`;
}

/**
 * The other wallet in a pair room, from the viewer's perspective.
 *
 * Lets the room list label a conversation with who it is *with*, which is what
 * the reader wants, rather than with whatever name the creator happened to
 * type. Returns null for any room that is not a pair room.
 */
export function counterpartyIn(
  context: string | null | undefined,
  me: string | null | undefined,
): string | null {
  if (!context?.startsWith(PAIR_CONTEXT_PREFIX) || !me) return null;

  const [first, second] = context.slice(PAIR_CONTEXT_PREFIX.length).split(':');
  if (!first || !second) return null;

  const mine = me.toLowerCase();
  if (first === mine) return second;
  if (second === mine) return first;
  // A pair room the viewer is not part of. Possible if they were invited to
  // someone else's conversation; there is no "other party" to name.
  return null;
}

export function pairRoomName(a: string, b: string): string {
  return `${a} & ${b}`;
}

/**
 * Finds an existing room by any of several context keys, in priority order.
 *
 * Callers pass the current key first and any superseded ones after it, so a
 * conversation started before this scheme existed is still found instead of
 * being silently replaced by an empty new room.
 */
export function findRoomByContext(
  rooms: ChatRoom[] | undefined,
  contexts: (string | null | undefined)[],
): ChatRoom | null {
  if (!rooms?.length) return null;

  for (const context of contexts) {
    if (!context) continue;
    const match = rooms.find((room) => room.context === context);
    if (match) return match;
  }
  return null;
}

export interface PairRoomResult {
  roomId: string;
  /** True when this call created the room rather than finding it. */
  created: boolean;
  /**
   * Whether the counterparty currently has a way in. False means the room
   * exists but the invitation did not send — they will never see it, and the
   * UI has to say so rather than implying the message was delivered.
   */
  invited: boolean;
}

/**
 * Returns the room these two share, creating it if there is not one yet.
 *
 * Invitation, never addition: the server has no way to put somebody in a room
 * without their consent, and it should not have one. Being dragged into a
 * conversation by the person disputing with you is not a feature.
 */
export async function ensurePairRoom({
  token,
  rooms,
  me,
  counterparty,
  myLabel,
  theirLabel,
  description,
  legacyContexts = [],
}: {
  token: string;
  /** The caller's already-loaded room list; avoids a second fetch. */
  rooms: ChatRoom[] | undefined;
  me: string;
  counterparty: string;
  myLabel?: string | null;
  theirLabel?: string | null;
  description?: string;
  /** Older keys for the same conversation, tried after the pair key. */
  legacyContexts?: string[];
}): Promise<PairRoomResult> {
  const context = pairRoomContext(me, counterparty);
  const existing = findRoomByContext(rooms, [context, ...legacyContexts]);

  if (existing) {
    // A room with one member is one whose invitation was never accepted —
    // the common case being that it was sent before invitations could be
    // accepted at all. Re-inviting is harmless if they are already in.
    const alone = existing.member_count !== undefined && existing.member_count < 2;
    const invited = alone
      ? await chat
          .inviteToRoom(token, existing.id, counterparty)
          .then(() => true)
          // Only the room's admin may invite, and a duplicate pending
          // invitation is refused. Neither is worth surfacing as a failure
          // when the room itself is fine.
          .catch(() => existing.member_count === undefined)
      : true;

    return { roomId: existing.id, created: false, invited };
  }

  const { room } = await chat.createRoom(token, {
    name: pairRoomName(
      myLabel?.trim() || shortenAddress(me, 4),
      theirLabel?.trim() || shortenAddress(counterparty, 4),
    ),
    description,
    // Private, and also the only type the server will accept an invitation
    // for. What two people agree about payment is nobody else's business.
    roomType: 'private',
    context,
  });

  const invited = await chat
    .inviteToRoom(token, room.id, counterparty)
    .then(() => true)
    .catch(() => false);

  return { roomId: room.id, created: true, invited };
}
