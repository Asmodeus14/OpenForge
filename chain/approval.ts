/**
 * A developer's signed agreement to a set of escrow terms.
 *
 * ## What this is, and what it is not
 *
 * The escrow contract has no notion of the developer consenting. Its
 * constructor requires only that the funder and developer differ, and anyone
 * can deploy one from a block explorer or a script. **Nothing here is enforced
 * on chain**, and the UI must never imply otherwise.
 *
 * What it does give you is real evidence. An EIP-712 signature over the exact
 * terms is non-repudiable: only the holder of the developer's key could have
 * produced it, and it covers the precise recipient, token, amounts, deadlines
 * and descriptions. Change any one of them and the signature stops verifying.
 * That is meaningfully different from a click in a database, which the person
 * running the server could fabricate.
 *
 * Signing costs nothing — no gas, no transaction, no token access. It is a
 * message signature, and the UI says so, because an unexplained wallet prompt
 * is what phishing looks like.
 */

import { verifyTypedData, type Signer } from 'ethers';
import { DEFAULT_CHAIN, SEPOLIA_CHAIN_ID } from './config';
import type { DeploySpec } from './gas';

/**
 * The signing domain.
 *
 * `verifyingContract` is the escrow registry rather than the escrow itself —
 * the escrow does not exist when the developer signs, and the registry is the
 * fixed contract this agreement is scoped to. `chainId` binds the signature to
 * Sepolia, so an approval cannot be replayed against a deployment elsewhere.
 */
export const APPROVAL_DOMAIN = {
  name: 'OpenForge Escrow',
  version: '1',
  chainId: SEPOLIA_CHAIN_ID,
  verifyingContract: DEFAULT_CHAIN.contracts.escrowRegistry,
} as const;

/**
 * The typed structure. Milestones are signed in full rather than as a hash so
 * the developer's wallet displays every amount and description it is agreeing
 * to — a hash would show them an opaque 32 bytes and ask them to trust the UI,
 * which defeats the purpose.
 */
// Not `as const`: ethers takes `Record<string, TypedDataField[]>`, and a
// readonly tuple is not assignable to a mutable array.
export const APPROVAL_TYPES: Record<string, { name: string; type: string }[]> = {
  Milestone: [
    { name: 'description', type: 'string' },
    { name: 'amount', type: 'uint256' },
    // Days from deployment, not an absolute timestamp. The funder does not
    // know when they will deploy, so an absolute deadline would drift between
    // signing and sending and invalidate every signature. "30 days" is also
    // what a developer is actually agreeing to, and reads far better in a
    // wallet prompt than a unix timestamp. 0 means no deadline.
    { name: 'deadlineDays', type: 'uint256' },
  ],
  EscrowTerms: [
    { name: 'funder', type: 'address' },
    { name: 'developer', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'milestones', type: 'Milestone[]' },
  ],
};

export interface EscrowTerms {
  funder: string;
  developer: string;
  token: string;
  milestones: { description: string; amount: string; deadlineDays: string }[];
}

/**
 * Canonical form of a deploy configuration.
 *
 * Takes the spec — deadlines still expressed in days — rather than resolved
 * parameters, which keeps this a pure function that can be called during
 * render. Resolving days to timestamps requires the clock, and a value derived
 * from `Date.now()` during render changes on every pass.
 *
 * `bigint` is serialised to a decimal string so the value survives JSON — it
 * travels through a chat message — and so the object hashed at signing time is
 * byte-identical to the one hashed at verification time. ethers accepts
 * decimal strings for `uint256`.
 */
export function termsFrom(spec: DeploySpec): EscrowTerms {
  return {
    funder: spec.funder.toLowerCase(),
    developer: spec.developer.toLowerCase(),
    token: spec.token.toLowerCase(),
    milestones: spec.milestones.map((milestone) => ({
      description: milestone.description,
      amount: milestone.amount.toString(),
      deadlineDays: String(milestone.days > 0 ? milestone.days : 0),
    })),
  };
}

/** The developer signs. Costs no gas and sends no transaction. */
export async function signEscrowTerms(
  signer: Signer,
  terms: EscrowTerms,
): Promise<string> {
  return signer.signTypedData(APPROVAL_DOMAIN, APPROVAL_TYPES, terms);
}

/**
 * Recovers the signer and checks it is the developer named in the terms.
 *
 * Returns false rather than throwing on a malformed signature: a corrupted
 * approval is an ordinary "not approved yet" state, not an error condition.
 */
export function verifyEscrowApproval(terms: EscrowTerms, signature: string): boolean {
  try {
    const recovered = verifyTypedData(
      APPROVAL_DOMAIN,
      APPROVAL_TYPES,
      terms,
      signature,
    );
    return recovered.toLowerCase() === terms.developer.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Whether an approval covers exactly the terms now on screen.
 *
 * Deliberately strict — a signature over different amounts is not a weaker
 * approval, it is approval of something else. Any edit to the configuration
 * invalidates it and the developer has to sign again.
 */
export function termsMatch(a: EscrowTerms, b: EscrowTerms): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/* ----------------------------------------------------------- transport */

/**
 * The wire format carried in a chat message.
 *
 * A fenced block with a marker line, so it survives a plain-text message
 * store, is obvious to a human reading the raw conversation, and can be found
 * again without the backend needing to understand it. The chat server has no
 * concept of structured attachments, and adding one would mean changing a
 * separate deployed service.
 */
export const PROPOSAL_MARKER = 'openforge:escrow-proposal';
export const APPROVAL_MARKER = 'openforge:escrow-approval';
export const CREATED_MARKER = 'openforge:escrow-created';

export interface ProposalPayload {
  kind: typeof PROPOSAL_MARKER;
  terms: EscrowTerms;
  /** Display only. The signature covers the terms, never this. */
  tokenSymbol: string;
  tokenDecimals: number;
  title: string;
}

export interface ApprovalPayload {
  kind: typeof APPROVAL_MARKER;
  terms: EscrowTerms;
  signature: string;
}

/**
 * The escrow that a proposal turned into.
 *
 * Posted by the funder's client once every deploy step has confirmed, so the
 * conversation records the outcome and not just the intent. Without it both
 * parties are left looking at a proposal with no way to tell whether it was
 * ever acted on — and the developer, who cannot deploy, has no other signal
 * at all.
 *
 * The address is a claim by the sender, exactly like the rest of a chat
 * message. It is worth having because it is checkable: the escrow at that
 * address states its own funder, developer, token and milestones on chain, and
 * the UI links there rather than restating the terms as though confirmed.
 */
export interface CreatedPayload {
  kind: typeof CREATED_MARKER;
  terms: EscrowTerms;
  escrowAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  title: string;
}

export type EscrowPayload = ProposalPayload | ApprovalPayload | CreatedPayload;

export function encodePayload(payload: EscrowPayload): string {
  return ['```' + payload.kind, JSON.stringify(payload), '```'].join('\n');
}

/**
 * Extracts a payload from message text, or null if there is not one.
 *
 * Never throws — chat content is arbitrary user input, and a message that
 * merely looks like a proposal must degrade to ordinary text rather than
 * breaking the transcript.
 */
export function decodePayload(content: string): EscrowPayload | null {
  const match = content.match(
    /```(?:openforge:escrow-(?:proposal|approval|created))\n([\s\S]*?)\n```/,
  );
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]) as EscrowPayload;
    if (
      parsed?.kind !== PROPOSAL_MARKER &&
      parsed?.kind !== APPROVAL_MARKER &&
      parsed?.kind !== CREATED_MARKER
    ) {
      return null;
    }
    if (!parsed.terms?.developer || !Array.isArray(parsed.terms.milestones)) return null;
    return parsed;
  } catch {
    return null;
  }
}
