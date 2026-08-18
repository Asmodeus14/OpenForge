'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircleCheck, MessagesSquare, Send, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/States';
import { DisclosureNote } from '@/components/trust/Trust';
import { PersonName, useDisplayName } from '@/components/trust/Identity';
import { useChatAuth } from '@/hooks/useChatAuth';
import { useChatRooms } from '@/hooks/useChatRooms';
import * as chat from '@/lib/chat/api';
import { ensurePairRoom, findRoomByContext, pairRoomContext } from '@/lib/chat/rooms';
import {
  decodePayload,
  encodePayload,
  termsMatch,
  verifyEscrowApproval,
  APPROVAL_MARKER,
  CREATED_MARKER,
  PROPOSAL_MARKER,
  type EscrowTerms,
  type ProposalPayload,
} from '@/chain/approval';
import { parseError } from '@/lib/errors';
import type { TokenInfo } from '@/chain/config';

/**
 * Getting the developer's agreement before any money is committed.
 *
 * The escrow contract cannot enforce this — its constructor requires only that
 * funder and developer differ, and anyone can deploy one from a block explorer
 * or a script. So this gate is a workflow, and the copy says so plainly rather
 * than implying the contract checks anything.
 *
 * What it does provide is a real signature over the exact terms. The developer
 * signs recipient, token, and every amount, deadline and description; editing
 * any of them invalidates it and the panel demands a fresh one. That is
 * materially stronger than a click recorded in a database, which whoever runs
 * the chat server could fabricate.
 *
 * The transport is the room these two already share — one per pair of wallets,
 * so the terms, the signature and any later dispute are all in one history.
 * The chat backend cannot attach structured data to a message, so the payload
 * is a fenced block in the text: legible to a human reading the raw
 * conversation, and ignorable by any client that does not understand it.
 */

/**
 * The conversation key this flow used before rooms were shared per pair.
 *
 * Still looked up, so a proposal sent under the old scheme is found rather
 * than superseded by an empty new room.
 */
function legacyProposalContext(funder: string, developer: string): string {
  return `escrow-proposal:${funder.toLowerCase()}:${developer.toLowerCase()}`;
}

/**
 * Finds the developer's approval, if there is a valid one for these terms.
 *
 * A hook rather than a prop callback, following the same rule as
 * `useTokenSelection`: the wizard owns the state and *derives* the approval
 * from it, so the deploy button and this panel can never disagree about
 * whether the terms are signed. Pushing the value up from a child during
 * render is a React error, and pushing it from an effect would make the
 * button lag a render behind the panel.
 */
export function useEscrowApproval(terms: EscrowTerms) {
  const auth = useChatAuth(terms.funder);
  const rooms = useChatRooms(auth.token);

  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);

  // By `context`, never by name — a rename must not orphan the conversation.
  const room =
    createdRoomId ??
    findRoomByContext(rooms.data, [
      pairRoomContext(terms.funder, terms.developer),
      legacyProposalContext(terms.funder, terms.developer),
    ])?.id ??
    null;

  // Polled: the funder is not on the messages page, so no socket is delivering
  // to them. Fifteen seconds is well inside the backend's 100-per-15-minutes
  // budget even with the room list refetching alongside it.
  const history = useQuery({
    queryKey: ['proposal-approvals', room],
    enabled: Boolean(auth.token && room),
    refetchInterval: 15_000,
    queryFn: () => chat.listMessages(auth.token!, room!, { limit: 50 }),
  });

  // Derived, never stored. An approval is only as good as the terms currently
  // on screen, and those change as the form is edited.
  const approval = (() => {
    for (const message of [...(history.data ?? [])].reverse()) {
      const payload = decodePayload(message.content);
      if (payload?.kind !== APPROVAL_MARKER) continue;
      if (!verifyEscrowApproval(payload.terms, payload.signature)) continue;
      if (!termsMatch(payload.terms, terms)) return { stale: true as const };
      return { stale: false as const, signature: payload.signature };
    }
    return null;
  })();

  // Whether this proposal has already become an escrow. Prevents the same
  // terms being deployed twice by someone who came back to the link and could
  // not tell that they had already acted on it.
  const alreadyCreated = (() => {
    for (const message of [...(history.data ?? [])].reverse()) {
      const payload = decodePayload(message.content);
      if (payload?.kind !== CREATED_MARKER) continue;
      if (!termsMatch(payload.terms, terms)) continue;
      return payload.escrowAddress;
    }
    return null;
  })();

  return {
    auth,
    rooms,
    history,
    room,
    setCreatedRoomId,
    approval,
    alreadyCreated,
    signature: approval && !approval.stale ? approval.signature : null,
  };
}

export function ApprovalGate({
  terms,
  token,
  title,
  resolution,
}: {
  terms: EscrowTerms;
  token: TokenInfo;
  title: string;
  resolution: ReturnType<typeof useEscrowApproval>;
}) {
  const { auth, rooms, history, room, setCreatedRoomId, approval, signature } = resolution;
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notInvited, setNotInvited] = useState(false);

  const me = useDisplayName(terms.funder);
  const them = useDisplayName(terms.developer);

  const approvedSignature = signature;

  async function send() {
    if (!auth.token) return;
    setSending(true);
    setError(null);
    setNotInvited(false);
    try {
      const pair = await ensurePairRoom({
        token: auth.token,
        rooms: rooms.data,
        me: terms.funder,
        counterparty: terms.developer,
        myLabel: me.name,
        theirLabel: them.name,
        description: `Escrow terms and payment between ${me.label} and ${them.label}.`,
        legacyContexts: [legacyProposalContext(terms.funder, terms.developer)],
      });

      setCreatedRoomId(pair.roomId);
      setNotInvited(!pair.invited);

      const payload: ProposalPayload = {
        kind: PROPOSAL_MARKER,
        terms,
        tokenSymbol: token.symbol,
        tokenDecimals: token.decimals,
        title,
      };
      await chat.postMessage(auth.token, pair.roomId, encodePayload(payload));
      await Promise.all([history.refetch(), rooms.refetch()]);
    } catch (err) {
      setError(parseError(err, 'The proposal was not sent').message);
    } finally {
      setSending(false);
    }
  }

  /* ---------------------------------------------------------------- states */

  if (!auth.token) {
    return (
      <div className="rounded-lg border border-line bg-subtle p-4">
        <p className="text-secondary font-medium text-fg">Get the developer to agree</p>
        <p className="mt-1.5 text-meta text-fg-secondary">
          Send these terms for the developer to sign. Messaging uses its own sign-in — a
          signature that costs no gas and grants no access to your tokens.
        </p>
        <Button
          className="mt-3"
          size="sm"
          loading={auth.isSigningIn}
          onClick={() => void auth.signIn()}
          leadingIcon={<MessagesSquare className="size-4" aria-hidden />}
        >
          Sign in to messaging
        </Button>
      </div>
    );
  }

  if (approvedSignature) {
    return (
      <div className="rounded-lg border border-success-line bg-success-subtle p-4">
        <p className="flex items-center gap-2 text-secondary font-medium text-fg">
          <CircleCheck className="size-4 text-success-text" aria-hidden />
          <PersonName address={terms.developer} /> signed these exact terms
        </p>
        <p className="mt-1.5 text-meta text-fg-secondary">
          Verified against their wallet. Editing any amount, deadline or description below
          invalidates it and needs a new signature.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-subtle p-4">
      <p className="text-secondary font-medium text-fg">Get the developer to agree</p>

      {approval?.stale && (
        <Alert tone="warning" title="The terms changed after they signed" className="mt-3">
          <PersonName address={terms.developer} /> signed a different version of this
          escrow. Send the current terms again so they can approve what you are actually
          about to deploy.
        </Alert>
      )}

      <p className="mt-1.5 text-meta text-fg-secondary">
        Send these terms to <PersonName address={terms.developer} /> for signature. They
        sign the exact amounts — nothing can be changed afterwards without invalidating it.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          loading={sending}
          onClick={() => void send()}
          leadingIcon={<Send className="size-4" aria-hidden />}
        >
          {room ? 'Send the current terms' : 'Send for approval'}
        </Button>
        {room && (
          <Link
            href={`/messages?room=${room}`}
            className="text-meta text-accent-text hover:underline underline-offset-4"
          >
            Open the conversation
          </Link>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-meta text-danger-text">
          {error}
        </p>
      )}

      {notInvited && (
        <Alert tone="warning" title="They were not invited to the room" className="mt-3">
          The terms were posted, but the invitation to <PersonName address={terms.developer} />{' '}
          did not send — so they cannot see it yet. Open the conversation and invite them.
        </Alert>
      )}

      {room && !approval && (
        <p className="mt-2.5 flex items-center gap-2 text-meta text-fg-muted">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
          Waiting for their signature. They must accept the room invitation first.
        </p>
      )}

      <DisclosureNote className="mt-3" tone="caution">
        This is an agreement between you two, not a rule the contract enforces. The escrow
        cannot check for the developer&rsquo;s approval, and deploying without one is
        always possible.
      </DisclosureNote>
    </div>
  );
}
