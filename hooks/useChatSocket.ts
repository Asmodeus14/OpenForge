'use client';

/**
 * The chat socket.
 *
 * One connection per session, and it stays up while the user moves between
 * rooms. The previous implementation had `selectedRoom` in the effect's
 * dependency array, so every room switch tore the socket down and
 * reconnected it — losing typing state, re-running the handshake, and
 * dropping any message that arrived during the gap.
 *
 * Handlers are read through a ref so that a parent re-rendering with a new
 * inline callback does not reconnect the socket either.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ChatMessage } from '@/lib/chat/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL;

export interface ChatSocketHandlers {
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (walletAddress: string, roomId: string) => void;
  onTypingStop?: (walletAddress: string, roomId: string) => void;
}

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

export function useChatSocket(token: string | null, handlers: ChatSocketHandlers) {
  const enabled = Boolean(token && SOCKET_URL);

  // Status is stored against the token it describes, so it can be *derived*
  // rather than reset in an effect. A stale 'connected' from a previous
  // session then never leaks into the next one.
  const [reported, setReported] = useState<{ token: string | null; status: SocketStatus }>({
    token: null,
    status: 'idle',
  });

  const status: SocketStatus = !enabled
    ? 'idle'
    : reported.token === token
      ? reported.status
      : 'connecting';

  const socketRef = useRef<Socket | null>(null);

  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!token || !SOCKET_URL) return;

    const report = (next: SocketStatus) => setReported({ token, status: next });

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => report('connected'));
    socket.on('disconnect', () => report('disconnected'));
    socket.on('connect_error', () => report('disconnected'));

    socket.on('new_message', (message: ChatMessage) =>
      handlersRef.current.onMessage?.(message),
    );
    socket.on('user_typing', (data: { walletAddress: string; roomId: string }) =>
      handlersRef.current.onTyping?.(data.walletAddress, data.roomId),
    );
    socket.on('user_typing_stop', (data: { walletAddress: string; roomId: string }) =>
      handlersRef.current.onTypingStop?.(data.walletAddress, data.roomId),
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      // No status reset here: `status` is derived from the current token, so
      // a torn-down session stops being reported the moment the token changes.
    };
    // Deliberately only the token: the connection must survive room changes.
  }, [token]);

  // Stable emitters, so a consumer can safely list them as effect
  // dependencies without reconnecting or rejoining on every render.
  const actions = useMemo(
    () => ({
      joinRoom: (roomId: string) => socketRef.current?.emit('join_room', { roomId }),
      leaveRoom: (roomId: string) => socketRef.current?.emit('leave_room', { roomId }),
      sendMessage: (roomId: string, content: string, parentMessageId?: string) =>
        socketRef.current?.emit('send_message', { roomId, content, parentMessageId }),
      startTyping: (roomId: string) => socketRef.current?.emit('typing', { roomId }),
      stopTyping: (roomId: string) => socketRef.current?.emit('typing_stop', { roomId }),
    }),
    [],
  );

  return { status, ...actions };
}
