/**
 * Chat types.
 *
 * These mirror what the backend actually returns, in its own snake_case,
 * rather than an idealised shape. Two details worth knowing:
 *
 *  - `GET /api/rooms/:roomId/messages` is served by `routes/rooms.js`, not
 *    `routes/messages.js`. Express matches `/api/rooms` first, so the route
 *    in `messages.js` is unreachable. The reachable one paginates by
 *    limit/offset and returns NO `like_count` or `liked_by` — those arrive
 *    only on the socket's `new_message` event. Code written against the
 *    unreachable route would show undefined counts on every historic message.
 *
 *  - Messages come back newest-first (`ORDER BY created_at DESC`), so they
 *    are reversed on read for display.
 */

export interface ChatUser {
  walletAddress: string;
  id: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string | null;
  is_private?: boolean;
  created_by?: number;
  created_at?: string;
  member_count?: number;
  /** Present on `/my`: this user's membership state in the room. */
  status?: 'approved' | 'pending' | 'rejected';
  role?: 'admin' | 'member';
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: number;
  sender_wallet: string;
  content: string;
  parent_message_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  is_edited?: boolean;
  /** Only populated on socket events — see the note above. */
  like_count?: number;
  liked_by?: string[];
}

export interface JoinRequest {
  id: string;
  room_id: string;
  user_id: number;
  wallet_address: string;
  status: string;
  created_at: string;
}

export interface ChatSession {
  token: string;
  walletAddress: string;
}
