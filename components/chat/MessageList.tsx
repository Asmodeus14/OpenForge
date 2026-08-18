'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { formatDateTime, formatRelative, isAddressEqual, shortenAddress } from '@/lib/format';
import { useDisplayName } from '@/components/trust/Identity';
import { decodePayload, PROPOSAL_MARKER } from '@/chain/approval';
import { ProposalCard, type ProposalDisplay } from '@/components/escrow/ProposalCard';
import type { ChatMessage } from '@/lib/chat/types';

/**
 * The message transcript.
 *
 * Consecutive messages from the same wallet within a few minutes are grouped
 * under one header, so a conversation reads as a conversation rather than as
 * a list of records each restating who is speaking.
 *
 * Senders are named, not addressed. A profile name is self-asserted, so the
 * wallet it belongs to stays beside it — the name is who they say they are,
 * the address is the part that is checkable.
 */

const GROUP_WINDOW_MS = 5 * 60 * 1000;

/**
 * Resolution happens in these leaves rather than in the list, because hooks
 * cannot be called in a loop over a list whose length changes. react-query
 * dedupes by address, so forty messages from two people cost two lookups.
 */
function SenderAvatar({ address }: { address: string }) {
  const { name, avatarUrl } = useDisplayName(address);
  return <Avatar src={avatarUrl} name={name ?? undefined} address={address} size="sm" />;
}

function SenderName({ address }: { address: string }) {
  const { name } = useDisplayName(address);

  if (!name) {
    return <span className="font-mono text-code text-fg">{shortenAddress(address, 4)}</span>;
  }

  return (
    <>
      <span className="text-secondary font-medium text-fg">{name}</span>
      <span className="font-mono text-micro text-fg-muted" title={address}>
        {shortenAddress(address, 4)}
      </span>
    </>
  );
}

function shouldGroup(message: ChatMessage, previous: ChatMessage | undefined): boolean {
  if (!previous) return false;
  if (!isAddressEqual(message.sender_wallet, previous.sender_wallet)) return false;
  const gap = Date.parse(message.created_at) - Date.parse(previous.created_at);
  return Number.isFinite(gap) && gap < GROUP_WINDOW_MS;
}

export function MessageList({
  messages,
  account,
  onEdit,
  onDelete,
  onApprove,
}: {
  messages: ChatMessage[];
  account: string | null;
  onEdit: (message: ChatMessage, content: string) => void;
  onDelete: (message: ChatMessage) => void;
  /** Posts a signed approval back into the room. */
  onApprove: (content: string) => Promise<void>;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  // Decoded once per transcript change rather than once per message per
  // render. A typing indicator or a draft keystroke re-renders this component,
  // and without this every message's content is re-scanned by regex each time.
  const payloads = useMemo(() => {
    const map = new Map<string, ReturnType<typeof decodePayload>>();
    for (const message of messages) {
      // Only text that could plausibly carry a payload is parsed at all.
      map.set(
        message.id,
        message.content.includes('openforge:escrow-')
          ? decodePayload(message.content)
          : null,
      );
    }
    return map;
  }, [messages]);

  // Token symbol, precision and title live on the proposal message only — an
  // approval covers the terms and nothing else, because that is exactly what
  // the signature covers. Rendering an approval's amounts therefore means
  // recovering the proposal it answers, matched on the terms themselves.
  const displayByTerms = useMemo(() => {
    const map = new Map<string, ProposalDisplay>();
    for (const payload of payloads.values()) {
      if (payload?.kind !== PROPOSAL_MARKER) continue;
      map.set(JSON.stringify(payload.terms), {
        tokenSymbol: payload.tokenSymbol,
        tokenDecimals: payload.tokenDecimals,
        title: payload.title,
      });
    }
    return map;
  }, [payloads]);

  // Scrolling to the newest message is a DOM side effect of new data
  // arriving, which is exactly what an effect is for.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-1 py-4">
      {messages.map((message, index) => {
        const grouped = shouldGroup(message, messages[index - 1]);
        const mine = isAddressEqual(message.sender_wallet, account);
        const editing = editingId === message.id;

        return (
          <article
            key={message.id}
            className={cn(
              'group relative flex gap-3 rounded-md px-3 transition-colors',
              grouped ? 'py-0.5' : 'mt-4 py-1 first:mt-0',
              'hover:bg-subtle',
            )}
          >
            <div className="w-8 shrink-0 pt-0.5">
              {!grouped && <SenderAvatar address={message.sender_wallet} />}
            </div>

            <div className="min-w-0 flex-1">
              {!grouped && (
                <div className="flex flex-wrap items-baseline gap-2">
                  <SenderName address={message.sender_wallet} />
                  {mine && <span className="text-micro text-accent-text">You</span>}
                  <time
                    dateTime={message.created_at}
                    title={formatDateTime(message.created_at) ?? undefined}
                    className="text-micro text-fg-muted"
                  >
                    {formatRelative(message.created_at)}
                  </time>
                </div>
              )}

              {editing ? (
                <div className="mt-1 flex items-start gap-2">
                  <textarea
                    value={draft}
                    autoFocus
                    rows={2}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setEditingId(null);
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        if (draft.trim()) onEdit(message, draft.trim());
                        setEditingId(null);
                      }
                    }}
                    className="flex-1 resize-y rounded-md border border-line bg-surface px-3 py-2 text-body text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-subtle"
                  />
                  <IconButton
                    label="Save changes"
                    size="sm"
                    icon={<Check className="size-4" aria-hidden />}
                    onClick={() => {
                      if (draft.trim()) onEdit(message, draft.trim());
                      setEditingId(null);
                    }}
                  />
                  <IconButton
                    label="Cancel editing"
                    size="sm"
                    icon={<X className="size-4" aria-hidden />}
                    onClick={() => setEditingId(null)}
                  />
                </div>
              ) : payloads.get(message.id) ? (
                // A structured escrow proposal or approval. The raw text is
                // still what the server stores, so a client that does not
                // understand it degrades to showing the block verbatim rather
                // than losing the message.
                <ProposalCard
                  payload={payloads.get(message.id)!}
                  account={account}
                  display={displayByTerms.get(
                    JSON.stringify(payloads.get(message.id)!.terms),
                  )}
                  onApprove={(content) => onApprove(content)}
                />
              ) : (
                <p className="whitespace-pre-wrap break-words text-body text-fg-secondary">
                  {message.content}
                  {message.is_edited && (
                    <span className="ml-1.5 text-micro text-fg-muted">(edited)</span>
                  )}
                </p>
              )}
            </div>

            {mine && !editing && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <IconButton
                    label="Message actions"
                    size="sm"
                    className="opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                    icon={<MoreHorizontal className="size-4" aria-hidden />}
                  />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    className="z-[var(--z-overlay)] min-w-40 rounded-lg border border-line bg-elevated p-1.5 shadow-[var(--shadow-lg)]"
                  >
                    <DropdownMenu.Item
                      onSelect={() => {
                        setDraft(message.content);
                        setEditingId(message.id);
                      }}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-secondary text-fg-secondary outline-none data-[highlighted]:bg-subtle data-[highlighted]:text-fg"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() => onDelete(message)}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-secondary text-danger-text outline-none data-[highlighted]:bg-danger-subtle"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}
          </article>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
