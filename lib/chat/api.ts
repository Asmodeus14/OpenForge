/**
 * Chat backend client.
 *
 * One place that knows the base URL, the auth header and how the server
 * reports errors. Every call goes through `request`, so a 401 always means
 * the same thing and rate limiting is handled once.
 *
 * The backend limits every IP to 100 requests per 15 minutes. That budget is
 * small enough that polling is not an option: live updates come from the
 * socket, and REST is used only for the initial load and for writes.
 */

import type {
  ChatMessage,
  ChatRoom,
  ChatRoomType,
  JoinRequest,
  RoomInvitation,
} from './types';

/**
 * The base URL, normalised to the server's origin.
 *
 * `NEXT_PUBLIC_API_URL` is conventionally written with the `/api` prefix
 * already on it, and the paths below also carry it. Stripping a trailing
 * `/api` here means either form of the variable works, instead of silently
 * producing `/api/api/auth/nonce` and a 404 that looks like the server is
 * down.
 */
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? '')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

export class ChatApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
  }
}

/** True when the failure means "sign in again" rather than "try again". */
export function isAuthError(error: unknown): boolean {
  return error instanceof ChatApiError && (error.status === 401 || error.status === 403);
}

async function request<T>(
  path: string,
  options: { method?: string; token?: string | null; body?: unknown } = {},
): Promise<T> {
  if (!BASE) {
    throw new ChatApiError(0, 'Messaging is not configured in this deployment.');
  }

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // The backend runs on a free tier that sleeps; a cold start looks
    // identical to being offline, and saying so is more useful than "failed
    // to fetch".
    throw new ChatApiError(
      0,
      'The messaging server did not respond. It sleeps when idle and can take up to a minute to wake.',
    );
  }

  if (response.status === 429) {
    throw new ChatApiError(429, 'Too many requests. Wait a few minutes and try again.');
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;

  if (!response.ok) {
    throw new ChatApiError(response.status, data.error ?? 'The request was not completed.');
  }
  return data;
}

/* -------------------------------------------------------------------- auth */

export function requestNonce(walletAddress: string) {
  return request<{ nonce: string; message: string }>('/api/auth/nonce', {
    method: 'POST',
    body: { walletAddress },
  });
}

export function verifySignature(walletAddress: string, signature: string) {
  return request<{ token: string; user: { walletAddress: string; id: number } }>(
    '/api/auth/verify',
    { method: 'POST', body: { walletAddress, signature } },
  );
}

/* ------------------------------------------------------------------- rooms */

/**
 * Rooms this wallet belongs to.
 *
 * The server answers with `{ approvedRooms, pendingRooms }`, not `{ rooms }`.
 * This previously read `data.rooms`, which is always `undefined` — so the room
 * list rendered empty no matter how many rooms the user was in. Verified
 * against a running backend.
 *
 * Membership status is folded onto each room so callers can tell a room they
 * are in from one they have merely asked to join.
 */
export async function listMyRooms(token: string): Promise<ChatRoom[]> {
  const data = await request<{
    approvedRooms?: ChatRoom[];
    pendingRooms?: ChatRoom[];
  }>('/api/rooms/my', { token });

  return [
    ...(data.approvedRooms ?? []).map((room) => ({ ...room, status: 'approved' as const })),
    ...(data.pendingRooms ?? []).map((room) => ({ ...room, status: 'pending' as const })),
  ];
}

export function listPublicRooms(token: string) {
  return request<{ rooms: ChatRoom[] }>('/api/rooms/public', { token });
}

/**
 * Creates a room.
 *
 * The server requires `roomType`, one of `public | private | p2p`, and rejects
 * the request outright without it. This previously sent `isPrivate`, so every
 * attempt to create a room returned 400 — room creation could not work at all.
 * Verified against a running backend.
 */
export function createRoom(
  token: string,
  input: {
    name: string;
    description?: string;
    roomType?: ChatRoomType;
    /**
     * Opaque key tying this room to what created it, e.g.
     * `escrow:0xabc…:dispute`. Lets a room be found again by identity rather
     * than by matching its display name, which breaks on rename.
     */
    context?: string;
  },
) {
  return request<{ room: ChatRoom }>('/api/rooms', {
    method: 'POST',
    token,
    body: {
      name: input.name,
      description: input.description,
      roomType: input.roomType ?? 'private',
      context: input.context,
    },
  });
}

/**
 * Invites a wallet to a private room.
 *
 * An invitation, not an addition — the invitee has to accept. Nobody can be
 * put into a room without agreeing, which is the correct behaviour even when
 * the room is created on their behalf.
 *
 * Only the room's admin may invite, and only to a `private` room.
 */
export function inviteToRoom(token: string, roomId: string, walletAddress: string) {
  return request<{ invitation: { id: string; status: string } }>(
    `/api/rooms/${roomId}/invite`,
    { method: 'POST', token, body: { walletAddress } },
  );
}

/* ------------------------------------------------------------ invitations */

/**
 * Invitations addressed to this wallet.
 *
 * Without these three calls an invitation was a dead end: the server recorded
 * it, and the invited party had no way to see or accept it — so every room
 * created on someone's behalf had exactly one member, its creator.
 */
export async function listInvitations(token: string): Promise<RoomInvitation[]> {
  const data = await request<{ invitations?: RoomInvitation[] }>('/api/invitations', {
    token,
  });
  return data.invitations ?? [];
}

export function acceptInvitation(token: string, invitationId: string) {
  return request<{ success: boolean; roomId?: string }>(
    `/api/invitations/${invitationId}/accept`,
    { method: 'POST', token },
  );
}

export function rejectInvitation(token: string, invitationId: string) {
  return request<{ success: boolean }>(`/api/invitations/${invitationId}/reject`, {
    method: 'POST',
    token,
  });
}

/**
 * Posts a message over HTTP rather than the socket.
 *
 * The socket is the right transport for a live conversation, but a message
 * written as part of another action — recording a dispute, say — must not
 * depend on a socket that may not be connected at that moment.
 */
export function postMessage(
  token: string,
  roomId: string,
  content: string,
) {
  return request<{ message: ChatMessage }>(`/api/rooms/${roomId}/messages`, {
    method: 'POST',
    token,
    body: { content },
  });
}

export function joinRoom(token: string, roomId: string) {
  return request<{ message?: string; status?: string }>(`/api/rooms/${roomId}/join`, {
    method: 'POST',
    token,
  });
}

export function leaveRoom(token: string, roomId: string) {
  return request<{ message?: string }>(`/api/rooms/${roomId}/leave`, {
    method: 'POST',
    token,
  });
}

export function deleteRoom(token: string, roomId: string) {
  return request<{ message?: string }>(`/api/rooms/${roomId}`, { method: 'DELETE', token });
}

export function listJoinRequests(token: string, roomId: string) {
  return request<{ requests: JoinRequest[] }>(`/api/rooms/${roomId}/requests`, { token });
}

export function approveJoinRequest(token: string, roomId: string, requestId: string) {
  return request<{ message?: string }>(
    `/api/rooms/${roomId}/requests/${requestId}/approve`,
    { method: 'POST', token },
  );
}

export function rejectJoinRequest(token: string, roomId: string, requestId: string) {
  return request<{ message?: string }>(
    `/api/rooms/${roomId}/requests/${requestId}/reject`,
    { method: 'POST', token },
  );
}

/* ---------------------------------------------------------------- messages */

/**
 * Loads a page of history.
 *
 * Hits the route in `rooms.js` — see the note in `types.ts` about why the one
 * in `messages.js` is unreachable. Results arrive newest-first and are
 * reversed here so callers always work in reading order.
 */
export async function listMessages(
  token: string,
  roomId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<ChatMessage[]> {
  const params = new URLSearchParams({
    limit: String(options.limit ?? 50),
    offset: String(options.offset ?? 0),
  });
  const data = await request<{ messages: ChatMessage[] }>(
    `/api/rooms/${roomId}/messages?${params}`,
    { token },
  );
  return [...(data.messages ?? [])].reverse();
}

export function editMessage(token: string, messageId: string, content: string) {
  return request<{ message: ChatMessage }>(`/api/messages/${messageId}`, {
    method: 'PUT',
    token,
    body: { content },
  });
}

export function deleteMessage(token: string, messageId: string) {
  return request<{ message?: string }>(`/api/messages/${messageId}`, {
    method: 'DELETE',
    token,
  });
}
