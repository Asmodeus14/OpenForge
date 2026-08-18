import * as chat from './api';
import { ensurePairRoom } from './rooms';
import type { ChatRoom } from './types';
import { DEFAULT_CHAIN } from '@/chain/config';

/**
 * The conversation attached to an open dispute.
 *
 * A dispute is the one point in an escrow's life where the two parties most
 * need to talk and where the contract offers no mediation whatsoever. It is
 * also the point where the *history* matters most — what was proposed, what
 * was signed, what was delivered. So a dispute does not get its own room: it
 * is posted into the room these two already share, underneath the terms it is
 * about. Starting a fresh room would separate the argument from the evidence.
 *
 * Three things happen, and each is reported separately because they fail
 * independently:
 *
 *   1. the shared room is found, or created if this is their first contact
 *   2. the counterparty is *invited*, if they are not already in it
 *   3. the dispute notice is posted
 *
 * Step two is an invitation, not an addition. The backend has no way to put
 * somebody in a room without their consent, and it should not — being forced
 * into a conversation by the person disputing with you is not a feature. The
 * UI says the invitation is pending rather than implying the other party is
 * already there.
 *
 * None of this is on chain. The dispute itself is the transaction; this is a
 * convenience layered on top, and it must never be presented as part of the
 * dispute's effect.
 */

export interface DisputeRoomResult {
  roomId: string;
  /** False when the room exists but the counterparty could not be invited. */
  invited: boolean;
  /** False when the room exists but the dispute notice did not post. */
  posted: boolean;
}

/**
 * The key this flow used before rooms were shared per pair — one room per
 * escrow. Still looked up so an existing dispute room is found rather than
 * abandoned, but no longer created.
 */
export function disputeRoomContext(escrowAddress: string): string {
  return `escrow:${escrowAddress.toLowerCase()}:dispute`;
}

export async function openDisputeRoom({
  token,
  rooms,
  escrowAddress,
  counterparty,
  raisedBy,
  raisedByLabel,
  counterpartyLabel,
  reason,
}: {
  token: string;
  /** The caller's already-loaded room list. */
  rooms: ChatRoom[] | undefined;
  escrowAddress: string;
  /** The other party — funder if a developer raised it, and vice versa. */
  counterparty: string;
  raisedBy: string;
  raisedByLabel?: string | null;
  counterpartyLabel?: string | null;
  reason: string;
}): Promise<DisputeRoomResult> {
  const pair = await ensurePairRoom({
    token,
    rooms,
    me: raisedBy,
    counterparty,
    myLabel: raisedByLabel,
    theirLabel: counterpartyLabel,
    description: `Escrow terms and payment between ${raisedByLabel ?? 'the funder'} and ${counterpartyLabel ?? 'the developer'}.`,
    legacyContexts: [disputeRoomContext(escrowAddress)],
  });

  // Best-effort. The room already exists and the dispute is already on chain,
  // so a failure here must not read as either of those having gone wrong.
  const posted = await chat
    .postMessage(
      token,
      pair.roomId,
      openingMessage({
        escrowAddress,
        raisedBy: raisedByLabel?.trim() || raisedBy,
        reason,
      }),
    )
    .then(() => true)
    .catch(() => false);

  return { roomId: pair.roomId, invited: pair.invited, posted };
}

/**
 * The opening message.
 *
 * States the facts of the dispute and nothing else. It is deliberately not
 * framed as an argument for either side — whoever raised it gets to make
 * their case in their own words, below.
 */
function openingMessage({
  escrowAddress,
  raisedBy,
  reason,
}: {
  escrowAddress: string;
  raisedBy: string;
  reason: string;
}): string {
  return [
    `A dispute was raised on the escrow at ${escrowAddress}.`,
    ``,
    `Raised by: ${raisedBy}`,
    `Network: ${DEFAULT_CHAIN.label}`,
    `Reason given: ${reason}`,
    ``,
    `The contract does not arbitrate. The funder can end this dispute in their own favour at any time; the developer can only do so after 30 days. Anything agreed here has to be carried out by whoever holds that power.`,
  ].join('\n');
}
