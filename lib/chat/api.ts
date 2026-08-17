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

import type { ChatMessage, ChatRoom, JoinRequest } from './types';

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

export function listMyRooms(token: string) {
  return request<{ rooms: ChatRoom[] }>('/api/rooms/my', { token });
}

export function listPublicRooms(token: string) {
  return request<{ rooms: ChatRoom[] }>('/api/rooms/public', { token });
}

export function createRoom(
  token: string,
  input: { name: string; description?: string; isPrivate?: boolean },
) {
  return request<{ room: ChatRoom }>('/api/rooms', { method: 'POST', token, body: input });
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
