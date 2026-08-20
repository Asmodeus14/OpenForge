/**
 * Chat types.
 *
 * These mirror what the backend actually returns, in its own snake_case,
 * rather than an idealised shape. Two details worth knowing:
 *
 *  - `GET /api/rooms/:roomId/messages` is served by `routes/messages.js`. It
 *    used to be shadowed by a duplicate in `routes/rooms.js` that returned no
 *    reaction data, so historic messages lost the likes they had shown when
 *    they arrived over the socket. The duplicate is gone; the surviving route
 *    keeps limit/offset pagination and now reports `like_count`, `liked_by`
 *    and `is_liked_by_me` on history as well. Both fields stay optional here,
 *    because a deployed backend may still be serving the old route.
 *
 *  - Messages come back newest-first (`ORDER BY created_at DESC`), so they
 *    are reversed on read for display.
 */

export interface ChatUser {
  walletAddress: string;
  id: number;
}

/** The server's own vocabulary. It rejects anything outside this set. */
export type ChatRoomType = 'public' | 'private' | 'p2p';

export interface ChatRoom {
  id: string;
  name: string;
  description?: string | null;
  room_type?: ChatRoomType;
  /** Opaque key set at creation, e.g. `escrow:0xabc…:dispute`. */
  context?: string | null;
  is_private?: boolean;
  created_by?: number;
  created_at?: string;
  member_count?: number;
  /** Present on `/my`: this user's membership state in the room. */
  status?: 'approved' | 'pending' | 'rejected';
  /**
   * Present on `/my`, from `room_members`. Only an admin may delete the room
   * or invite to it; everyone else can only leave.
   */
  is_admin?: boolean;
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
  like_count?: number;
  /** Every wallet that reacted, not just this one. */
  liked_by?: string[];
  is_liked_by_me?: boolean;
}

/** An invitation to a private room, addressed to a wallet address. */
export interface RoomInvitation {
  id: string;
  room_id: string;
  room_name?: string;
  inviter_wallet?: string;
  invitee_wallet_address: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
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
