'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Hash,
  Lock,
  MessageSquare,
  PenSquare,
  Plus,
  Users,
  Wallet,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { Page, PageHeader } from '@/components/ui/Layout';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog';
import { Input, Textarea } from '@/components/ui/Input';
import { DisclosureNote } from '@/components/trust/Trust';
import { MessageList } from '@/components/chat/MessageList';
import { Composer } from '@/components/chat/Composer';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import { useChatAuth } from '@/hooks/useChatAuth';
import { useChatSocket } from '@/hooks/useChatSocket';
import * as chat from '@/lib/chat/api';
import { isAuthError } from '@/lib/chat/api';
import { cn } from '@/lib/cn';
import { shortenAddress } from '@/lib/format';
import type { ChatMessage, ChatRoom } from '@/lib/chat/types';

/**
 * Messages.
 *
 * Built against what the chat backend actually implements. Two surfaces that
 * existed in the previous interface are gone, because the endpoints behind
 * them return 404: file attachments (`POST /api/messages/upload`) and link
 * previews (`GET /api/metadata`). A paperclip that always fails is worse than
 * no paperclip.
 *
 * History loads once over REST; everything after that arrives on the socket.
 * The backend allows 100 requests per 15 minutes per IP, which polling would
 * exhaust in minutes.
 */
export function MessagesClient() {
  const wallet = useWalletContext();
  const auth = useChatAuth(wallet.account);
  const queryClient = useQueryClient();

  const [roomId, setRoomId] = useState<string | null>(null);
  /** Messages that arrived on the socket since this room's history loaded. */
  const [live, setLive] = useState<ChatMessage[]>([]);
  const [liveRoomId, setLiveRoomId] = useState<string | null>(null);
  const [typing, setTyping] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ChatMessage | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const token = auth.token;

  /* -------------------------------------------------------------- rooms */

  const rooms = useQuery({
    queryKey: ['chat-rooms', token],
    enabled: Boolean(token),
    staleTime: 60_000,
    queryFn: () => chat.listMyRooms(token!).then((data) => data.rooms ?? []),
  });

  const activeRoom = useMemo(
    () => rooms.data?.find((room) => room.id === roomId) ?? null,
    [rooms.data, roomId],
  );

  /* ------------------------------------------------------------ history */

  const history = useQuery({
    queryKey: ['chat-messages', roomId],
    enabled: Boolean(token && roomId),
    // History is superseded by socket events, so it must not silently refetch
    // and overwrite messages that arrived live.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: () => chat.listMessages(token!, roomId!),
  });

  // Changing room resets the live buffer during render rather than in an
  // effect — React's documented way to adjust state when an input changes,
  // and it avoids rendering the previous room's messages for one frame.
  if (liveRoomId !== roomId) {
    setLiveRoomId(roomId);
    setLive([]);
    setTyping([]);
  }

  // The transcript is derived, not copied: history owns the past, the socket
  // buffer owns everything since. Copying history into state would mean an
  // edit had to be written to two places and could disagree with itself.
  const messages = useMemo(() => {
    const past = history.data ?? [];
    const seen = new Set(past.map((message) => message.id));
    return [...past, ...live.filter((message) => !seen.has(message.id))];
  }, [history.data, live]);

  /* ------------------------------------------------------------- socket */

  const onMessage = useCallback((message: ChatMessage) => {
    setLive((prev) =>
      // The sender is in the room too, so their own message comes back to
      // them. Ignore the duplicate rather than rendering it twice.
      prev.some((existing) => existing.id === message.id) ? prev : [...prev, message],
    );
  }, []);

  const onTyping = useCallback((walletAddress: string) => {
    setTyping((prev) => (prev.includes(walletAddress) ? prev : [...prev, walletAddress]));
  }, []);

  const onTypingStop = useCallback((walletAddress: string) => {
    setTyping((prev) => prev.filter((address) => address !== walletAddress));
  }, []);

  const handlers = useMemo(
    () => ({ onMessage, onTyping, onTypingStop }),
    [onMessage, onTyping, onTypingStop],
  );

  const socket = useChatSocket(token, handlers);

  // Joining a room is a socket side effect of the selection changing, and the
  // previous room must be left so its broadcasts stop arriving.
  const { joinRoom, leaveRoom, status: socketStatus } = socket;
  useEffect(() => {
    if (!roomId || socketStatus !== 'connected') return;
    joinRoom(roomId);
    return () => {
      leaveRoom(roomId);
    };
  }, [roomId, socketStatus, joinRoom, leaveRoom]);

  // A rejected token must not leave the user staring at a permanent error.
  const { signOut } = auth;
  useEffect(() => {
    if (rooms.error && isAuthError(rooms.error)) signOut();
  }, [rooms.error, signOut]);

  /* ------------------------------------------------------------ actions */

  async function withErrors(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(error);
    }
  }

  /** Applies a local change to whichever half of the transcript holds it. */
  function patchMessage(id: string, patch: Partial<ChatMessage>) {
    queryClient.setQueryData<ChatMessage[]>(['chat-messages', roomId], (prev) =>
      prev?.map((message) => (message.id === id ? { ...message, ...patch } : message)),
    );
    setLive((prev) =>
      prev.map((message) => (message.id === id ? { ...message, ...patch } : message)),
    );
  }

  function removeMessage(id: string) {
    queryClient.setQueryData<ChatMessage[]>(['chat-messages', roomId], (prev) =>
      prev?.filter((message) => message.id !== id),
    );
    setLive((prev) => prev.filter((message) => message.id !== id));
  }

  /* ------------------------------------------------------------- states */

  if (!wallet.account) {
    return (
      <Page>
        <PageHeader title="Messages" description="Rooms you belong to." />
        <div className="border-t border-line">
          <EmptyState
            icon={<Wallet className="size-5" aria-hidden />}
            title="Connect a wallet to use messaging"
            description="Your wallet address is your identity in chat — there are no usernames or passwords."
            action={
              <Button
                variant="primary"
                onClick={wallet.connect}
                loading={wallet.isConnecting}
                leadingIcon={<Wallet className="size-4" aria-hidden />}
              >
                Connect wallet
              </Button>
            }
          />
        </div>
      </Page>
    );
  }

  if (!token) {
    return (
      <Page width="content">
        <PageHeader title="Messages" description="Rooms you belong to." />
        <div className="border-t border-line py-12">
          <h2 className="text-section text-fg">Sign in to messaging</h2>
          <p className="mt-3 max-w-lg text-body text-fg-secondary">
            Chat runs on a conventional server, which cannot read the blockchain. To prove
            this wallet is yours it asks you to sign a short phrase it generated.
          </p>

          <DisclosureNote className="mt-6">
            This is an off-chain signature. It costs no gas, moves no funds, and grants no
            permission over your tokens — it only proves you control this address.
          </DisclosureNote>

          {auth.error && (
            <ErrorState
              error={auth.error}
              context="You were not signed in"
              className="mt-6"
            />
          )}

          <Button
            variant="primary"
            size="lg"
            className="mt-8"
            loading={auth.isSigningIn}
            onClick={() => void auth.signIn()}
          >
            Sign a message to continue
          </Button>
        </div>
      </Page>
    );
  }

  /* ------------------------------------------------------------- layout */

  return (
    // Full height minus the top bar, and on mobile the tab bar as well, so
    // the composer sits directly above whichever chrome is on screen.
    <Page
      width="wide"
      className="flex h-[calc(100dvh-7rem)] flex-col lg:h-[calc(100dvh-3.5rem)]"
    >
      <PageHeader
        title="Messages"
        description="Rooms you belong to. Messages are stored on the OpenForge chat server, not on chain."
        actions={
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            leadingIcon={<Plus className="size-4" aria-hidden />}
          >
            New room
          </Button>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 border-t border-line md:grid-cols-[16rem_minmax(0,1fr)]">
        {/* ----------------------------------------------------- room list */}
        <nav
          aria-label="Rooms"
          className={cn(
            'min-h-0 overflow-y-auto py-4 md:border-r md:border-line md:pr-4',
            roomId && 'hidden md:block',
          )}
        >
          {rooms.isPending ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>
          ) : rooms.isError ? (
            <ErrorState
              error={rooms.error}
              context="Rooms could not be loaded"
              compact
              onRetry={() => void rooms.refetch()}
            />
          ) : rooms.data.length === 0 ? (
            <p className="px-2 py-6 text-secondary text-fg-secondary">
              You are not in any rooms yet. Create one to start a conversation.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {rooms.data.map((room: ChatRoom) => (
                <li key={room.id}>
                  <button
                    type="button"
                    onClick={() => setRoomId(room.id)}
                    aria-current={room.id === roomId ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left',
                      'text-secondary transition-colors duration-[var(--dur-fast)]',
                      room.id === roomId
                        ? 'bg-subtle font-medium text-fg'
                        : 'text-fg-secondary hover:bg-subtle hover:text-fg',
                    )}
                  >
                    {room.is_private ? (
                      <Lock className="size-3.5 shrink-0 text-fg-muted" aria-hidden />
                    ) : (
                      <Hash className="size-3.5 shrink-0 text-fg-muted" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate">{room.name}</span>
                    {room.status === 'pending' && (
                      <span className="shrink-0 text-micro text-warning-text">Pending</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {/* ------------------------------------------------------ transcript */}
        <section className={cn('flex min-h-0 flex-col', !roomId && 'hidden md:flex')}>
          {!activeRoom ? (
            <EmptyState
              icon={<MessageSquare className="size-5" aria-hidden />}
              title="No room selected"
              description="Choose a room on the left, or create one. Everyone in a room can read everything posted in it."
            />
          ) : (
            <>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  {/* Below `md` the room list is hidden while a room is open,
                      so without this there is no way back to it. */}
                  <IconButton
                    label="Back to rooms"
                    size="sm"
                    className="-ml-1 md:hidden"
                    onClick={() => setRoomId(null)}
                    icon={<ChevronLeft className="size-4" aria-hidden />}
                  />
                  <div className="min-w-0">
                  <h2 className="truncate text-body font-medium text-fg">
                    {activeRoom.name}
                  </h2>
                  {activeRoom.description && (
                    <p className="mt-0.5 truncate text-meta text-fg-muted">
                      {activeRoom.description}
                    </p>
                  )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-meta text-fg-muted">
                  {activeRoom.member_count !== undefined && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" aria-hidden />
                      {activeRoom.member_count}
                    </span>
                  )}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      socket.status === 'connected' ? 'text-fg-muted' : 'text-warning-text',
                    )}
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        socket.status === 'connected' ? 'bg-success' : 'bg-warning',
                      )}
                      aria-hidden
                    />
                    {socket.status === 'connected' ? 'Live' : 'Reconnecting'}
                  </span>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {history.isPending ? (
                  <div className="flex flex-col gap-3 p-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                  </div>
                ) : history.isError ? (
                  <div className="p-4">
                    <ErrorState
                      error={history.error}
                      context="Messages could not be loaded"
                      onRetry={() => void history.refetch()}
                    />
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={<PenSquare className="size-5" aria-hidden />}
                    title="No messages yet"
                    description="Say something to start the conversation. Everyone in this room will see it."
                  />
                ) : (
                  <MessageList
                    messages={messages}
                    account={wallet.account}
                    onEdit={(message, content) =>
                      void withErrors(async () => {
                        await chat.editMessage(token, message.id, content);
                        patchMessage(message.id, { content, is_edited: true });
                      })
                    }
                    onDelete={setPendingDelete}
                  />
                )}
              </div>

              {actionError !== null && (
                <div className="px-4 pb-2">
                  <ErrorState
                    error={actionError}
                    context="That did not go through"
                    compact
                  />
                </div>
              )}

              {typing.length > 0 && (
                <p aria-live="polite" className="px-4 pb-1 text-micro text-fg-muted">
                  {typing.map((address) => shortenAddress(address, 4)).join(', ')}{' '}
                  {typing.length === 1 ? 'is' : 'are'} typing…
                </p>
              )}

              <Composer
                disabled={socket.status !== 'connected'}
                placeholder={
                  socket.status === 'connected'
                    ? `Message ${activeRoom.name}`
                    : 'Reconnecting to the messaging server…'
                }
                onSend={(content) => socket.sendMessage(activeRoom.id, content)}
                onTyping={() => socket.startTyping(activeRoom.id)}
                onTypingStop={() => socket.stopTyping(activeRoom.id)}
              />
            </>
          )}
        </section>
      </div>

      <CreateRoomDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(input) =>
          void withErrors(async () => {
            const { room } = await chat.createRoom(token, input);
            await queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
            setRoomId(room.id);
            setCreateOpen(false);
          })
        }
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this message?"
        description="It will be removed for everyone in the room. This cannot be undone."
        confirmLabel="Delete message"
        destructive
        onConfirm={() => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (!target) return;
          void withErrors(async () => {
            await chat.deleteMessage(token, target.id);
            removeMessage(target.id);
          });
        }}
      />
    </Page>
  );
}

function CreateRoomDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { name: string; description?: string; isPrivate: boolean }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New room"
      description="A room is a shared conversation. Anyone in it can read everything posted."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={name.trim().length < 2}
            onClick={() =>
              onCreate({
                name: name.trim(),
                description: description.trim() || undefined,
                isPrivate,
              })
            }
          >
            Create room
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Input
          label="Name"
          required
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder="payments-rewrite"
        />
        <Textarea
          label="Description"
          rows={3}
          value={description}
          maxLength={200}
          showCount
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What this room is for."
        />
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => setIsPrivate(event.target.checked)}
            className="mt-1 size-4 rounded-xs accent-[var(--accent)]"
          />
          <span>
            <span className="block text-secondary font-medium text-fg">Private room</span>
            <span className="block text-meta text-fg-muted">
              People must request to join and you approve them. Public rooms can be joined by
              anyone with an account.
            </span>
          </span>
        </label>

        <Alert tone="info">
          Messages live on the OpenForge chat server, not on the blockchain. They are not
          encrypted end to end, and anyone running that server can read them.
        </Alert>
      </div>
    </Dialog>
  );
}
