'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import * as chat from '@/lib/chat/api';
import { Person } from '@/components/trust/Identity';
import { parseError } from '@/lib/errors';

/**
 * Invitations waiting for this wallet.
 *
 * Nothing rendered these before, so an invitation was a dead end: the server
 * recorded it, the invited party never saw it, and every room created on
 * someone else's behalf ended up with exactly one member. Any flow that
 * invites a counterparty — a dispute room, an escrow proposal — depended on
 * this and quietly did nothing.
 *
 * Accepting is the invitee's decision and stays that way. The alternative,
 * adding people to rooms automatically, would mean anyone could put anyone
 * into a conversation.
 */
export function Invitations({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invitations = useQuery({
    queryKey: ['chat-invitations', token],
    staleTime: 30_000,
    // Somebody can invite you at any moment, and an invitation nobody sees is
    // the same as no invitation — which is exactly how this failed before it
    // had any UI at all. The timer pauses while the tab is in the background.
    refetchInterval: 30_000,
    queryFn: () => chat.listInvitations(token),
  });

  const pending = (invitations.data ?? []).filter(
    (invitation) => invitation.status === 'pending',
  );

  if (pending.length === 0) return null;

  async function respond(id: string, accept: boolean) {
    setBusyId(id);
    setError(null);
    try {
      if (accept) await chat.acceptInvitation(token, id);
      else await chat.rejectInvitation(token, id);
      await Promise.all([
        invitations.refetch(),
        // An accepted invitation adds a room, so that list is now stale.
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] }),
      ]);
    } catch (err) {
      setError(parseError(err, 'That did not go through').message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="border-b border-line px-3 py-3" aria-label="Invitations">
      <h2 className="flex items-center gap-2 text-micro uppercase tracking-wide text-fg-muted">
        <Mail className="size-3.5" aria-hidden />
        Invitations
      </h2>

      <ul className="mt-2 flex flex-col gap-2">
        {pending.map((invitation) => (
          <li key={invitation.id} className="rounded-md border border-line bg-subtle p-2.5">
            {/* Who invited you matters more than what they called the room,
                so the person leads. The address stays next to the name: a
                profile name is self-asserted, and an invitation is exactly
                the moment someone might borrow one. */}
            {invitation.inviter_wallet ? (
              <Person address={invitation.inviter_wallet} chars={4} showExplorer={false} />
            ) : (
              <p className="truncate text-secondary text-fg">
                {invitation.room_name ?? 'A private room'}
              </p>
            )}
            {invitation.inviter_wallet && (
              <p className="mt-0.5 truncate text-meta text-fg-muted">
                invited you to {invitation.room_name ?? 'a private room'}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="primary"
                loading={busyId === invitation.id}
                onClick={() => void respond(invitation.id, true)}
              >
                Join
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busyId === invitation.id}
                onClick={() => void respond(invitation.id, false)}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="mt-2 text-meta text-danger-text">
          {error}
        </p>
      )}
    </section>
  );
}
