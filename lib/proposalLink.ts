import { isAddress } from 'ethers';
import { PROPOSAL_MARKER, type ProposalPayload } from '@/chain/approval';

/**
 * Carrying a set of proposed terms into the escrow form.
 *
 * The problem this solves is losing work. A funder fills in the milestones,
 * sends them for the developer to sign, and closes the tab. Two days later the
 * signature arrives — and the form is empty, so they retype every amount from
 * memory. Any transcription slip at that point becomes an immutable contract
 * paying the wrong number to an address that cannot be changed.
 *
 * The proposal already exists as a message in the room, so the link back into
 * the form carries it rather than asking anyone to remember it. The terms are
 * base64url'd into the query string, which means the link works from a chat
 * message, a bookmark or a pasted URL, with no session and no server lookup.
 *
 * ## Why an unsigned URL is safe here
 *
 * Anyone can craft one of these; it fills in a form, nothing more. Three things
 * stand between a tampered link and a bad escrow, and none of them trust it:
 *
 *  - The form is reviewed and edited by the funder before anything is sent, and
 *    `RecipientCheck` reports what the chain knows about the payee.
 *  - Approval is never read from the link. It is re-derived from the room and
 *    the EIP-712 signature is verified against the terms actually on screen.
 *  - The funder is always the connected wallet, never the value in the link. A
 *    signature naming a different funder therefore fails to match, which is
 *    correct: the developer agreed to be paid by *that* person.
 */

export const PROPOSAL_PARAM = 'proposal';

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const normalised = value.replace(/-/g, '+').replace(/_/g, '/');
  // `atob` rejects unpadded input in some runtimes, and the padding is
  // stripped above to keep the URL clean.
  const padded = normalised + '='.repeat((4 - (normalised.length % 4)) % 4);
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function encodeProposalParam(payload: ProposalPayload): string {
  return toBase64Url(JSON.stringify(payload));
}

/** `/escrow/new?proposal=…` — the form, pre-filled with these exact terms. */
export function proposalHref(payload: ProposalPayload): string {
  return `/escrow/new?${PROPOSAL_PARAM}=${encodeProposalParam(payload)}`;
}

const DECIMAL_STRING = /^\d+$/;

/**
 * Reads a proposal out of a query parameter.
 *
 * Returns null for anything malformed and never throws: a query string is
 * arbitrary input, and a corrupted link must degrade to the ordinary blank
 * form rather than to an error page. Every field is checked, because these
 * values go on to be parsed as addresses and token amounts.
 */
export function decodeProposalParam(value?: string | null): ProposalPayload | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(value)) as ProposalPayload;

    if (parsed?.kind !== PROPOSAL_MARKER) return null;

    const { terms } = parsed;
    if (!terms || !isAddress(terms.developer) || !isAddress(terms.token)) return null;
    if (!Array.isArray(terms.milestones) || terms.milestones.length === 0) return null;

    const milestonesValid = terms.milestones.every(
      (milestone) =>
        typeof milestone?.description === 'string' &&
        DECIMAL_STRING.test(String(milestone?.amount)) &&
        DECIMAL_STRING.test(String(milestone?.deadlineDays)),
    );
    if (!milestonesValid) return null;

    if (!Number.isInteger(parsed.tokenDecimals)) return null;
    if (parsed.tokenDecimals < 0 || parsed.tokenDecimals > 36) return null;

    return parsed;
  } catch {
    return null;
  }
}
