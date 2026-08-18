'use client';

import { useQuery } from '@tanstack/react-query';
import * as chat from '@/lib/chat/api';
import type { ChatRoom } from '@/lib/chat/types';

/**
 * The rooms this wallet belongs to.
 *
 * One definition, because three places need the list — the messages page, the
 * approval gate in the escrow form, and the dispute panel — and they must
 * agree about it. They had the same query written out three times, which meant
 * three chances for the polling policy to drift apart.
 *
 * The list changes without this user doing anything: accepting an invitation
 * elsewhere, someone opening a conversation with them. So it is polled rather
 * than only refetched on focus. The backend allows 100 requests per 15 minutes
 * per IP, which is the reason the interval is a minute and not a second; the
 * timer also pauses while the tab is in the background.
 */
export const CHAT_ROOMS_KEY = 'chat-rooms';

export function useChatRooms(token: string | null) {
  return useQuery<ChatRoom[]>({
    queryKey: [CHAT_ROOMS_KEY, token],
    enabled: Boolean(token),
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: () => chat.listMyRooms(token!),
  });
}
