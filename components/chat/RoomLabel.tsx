'use client';

import { useDisplayName } from '@/components/trust/Identity';
import { counterpartyIn } from '@/lib/chat/rooms';
import type { ChatRoom } from '@/lib/chat/types';

/**
 * What to call a room.
 *
 * A room between two people is labelled with who it is *with*, resolved from
 * the viewer's own perspective. The stored name is whatever the creator typed
 * and reads backwards for the other party — "Alice & Bob" tells Bob nothing he
 * wants to know. Deriving it from the room's `context` also means the label
 * follows a profile rename without anyone having to rename the room.
 *
 * Named rooms keep their name. This only applies where the room *is* the
 * relationship.
 */
export function useRoomLabel(
  room: ChatRoom | null | undefined,
  me: string | null,
): string {
  const counterparty = counterpartyIn(room?.context, me);
  const { label } = useDisplayName(counterparty);

  if (!room) return '';
  return counterparty ? label : room.name;
}

export function RoomLabel({ room, me }: { room: ChatRoom; me: string | null }) {
  const label = useRoomLabel(room, me);
  return <>{label}</>;
}
