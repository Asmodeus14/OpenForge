'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/States';
import { PersonName, useDisplayName } from '@/components/trust/Identity';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import { useChatAuth } from '@/hooks/useChatAuth';
import { useChatRooms } from '@/hooks/useChatRooms';
import { findRoomByContext, pairRoomContext } from '@/lib/chat/rooms';
import { disputeRoomContext, openDisputeRoom } from '@/lib/chat/disputeRoom';
import { parseError } from '@/lib/errors';

/**
 * The conversation attached to an open dispute.
 *
 * The contract provides no mediation at all — it only decides who may move the
 * money and when. Everything that actually resolves a dispute happens between
 * two people, and until now there was nowhere for that to happen.
 *
 * It opens the room these two already share rather than a new one, so the
 * dispute is argued directly beneath the terms that were proposed and signed.
 *
 * The notice is posted on demand rather than as a side effect of the dispute
 * transaction. Two reasons, both about honesty: posting it needs a separate
 * signature for messaging, which must not be bundled into a transaction the
 * user thought was about escrow; and a chat failure must never look like the
 * dispute itself having failed. The dispute is on chain and already done by
 * the time this panel appears.
 */
export function DisputeRoom({
  escrowAddress,
  counterparty,
  counterpartyRole,
}: {
  escrowAddress: string;
  counterparty: string;
  counterpartyRole: 'funder' | 'developer';
}) {
  const wallet = useWalletContext();
  const auth = useChatAuth(wallet.account);
  const me = useDisplayName(wallet.account);
  const them = useDisplayName(counterparty);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<{ roomId: string; invited: boolean } | null>(null);

  const rooms = useChatRooms(auth.token);

  // Matched on `context`, not on the display name — renaming a room must not
  // orphan it and silently cause a second one to be created. The per-escrow
  // key is still checked so dispute rooms opened under the old scheme resolve.
  const found = wallet.account
    ? findRoomByContext(rooms.data, [
        pairRoomContext(wallet.account, counterparty),
        disputeRoomContext(escrowAddress),
      ])
    : null;

  const existing = opened ?? (found ? { roomId: found.id, invited: true } : null);

  async function open() {
    if (!auth.token || !wallet.account) return;
    setCreating(true);
    setError(null);
    try {
      const result = await openDisputeRoom({
        token: auth.token,
        rooms: rooms.data,
        escrowAddress,
        counterparty,
        raisedBy: wallet.account,
        raisedByLabel: me.name,
        counterpartyLabel: them.name,
        reason: 'See the escrow for the reason recorded on chain.',
      });
      setOpened({ roomId: result.roomId, invited: result.invited });
      await rooms.refetch();
    } catch (err) {
      setError(parseError(err, 'The room was not opened').message);
    } finally {
      setCreating(false);
    }
  }

  /* ------------------------------------------------------- not signed in */

  if (!auth.token) {
    return (
      <div className="mt-5">
        <p className="text-secondary text-fg-secondary">
          Messaging uses a separate sign-in — a signature that costs no gas and grants no
          access to your tokens.
        </p>
        <Button
          className="mt-3"
          size="sm"
          loading={auth.isSigningIn}
          onClick={() => void auth.signIn()}
          leadingIcon={<MessagesSquare className="size-4" aria-hidden />}
        >
          Sign in to open the dispute
        </Button>
        {auth.error && (
          <p role="alert" className="mt-2 text-meta text-danger-text">
            {auth.error.message}
          </p>
        )}
      </div>
    );
  }

  /* --------------------------------------------------------- room exists */

  if (existing) {
    return (
      <div className="mt-5">
        <Link
          href={`/messages?room=${existing.roomId}`}
          className="inline-flex items-center gap-2 text-secondary text-accent-text hover:underline underline-offset-4"
        >
          <MessagesSquare className="size-4" aria-hidden />
          Open your conversation with <PersonName address={counterparty} />
        </Link>
        {opened && !opened.invited && (
          <Alert tone="warning" title="The other party was not invited" className="mt-3">
            The room exists, but the invitation to <PersonName address={counterparty} /> did
            not send. Invite them from the room, or they will never see it.
          </Alert>
        )}
        {opened?.invited && (
          <p className="mt-2 text-meta text-fg-muted">
            The dispute has been posted there. If <PersonName address={counterparty} /> has
            not joined the room yet they have to accept the invitation first — nobody is
            added to a conversation without agreeing.
          </p>
        )}
      </div>
    );
  }

  /* ----------------------------------------------------------- offer one */

  return (
    <div className="mt-5">
      <p className="text-secondary text-fg-secondary">
        There is no arbitration in the contract, so this has to be settled between you and
        the {counterpartyRole}. Post it to your conversation with{' '}
        <PersonName address={counterparty} />.
      </p>
      <Button
        className="mt-3"
        size="sm"
        loading={creating}
        onClick={() => void open()}
        leadingIcon={<MessagesSquare className="size-4" aria-hidden />}
      >
        Message the {counterpartyRole}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-meta text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
