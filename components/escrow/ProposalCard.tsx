'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowUpRight,
  CircleCheck,
  FileSignature,
  ShieldQuestion,
  SquarePen,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/States';
import { DisclosureNote } from '@/components/trust/Trust';
import { Person, PersonName } from '@/components/trust/Identity';
import { getSigner } from '@/chain/clients';
import { calculateFee, PROTOCOL } from '@/chain/config';
import {
  encodePayload,
  signEscrowTerms,
  verifyEscrowApproval,
  APPROVAL_MARKER,
  CREATED_MARKER,
  PROPOSAL_MARKER,
  type ApprovalPayload,
  type EscrowPayload,
  type ProposalPayload,
} from '@/chain/approval';
import { proposalHref } from '@/lib/proposalLink';
import { formatTokenAmount, isAddressEqual } from '@/lib/format';
import { parseError } from '@/lib/errors';

/**
 * An escrow proposal, its approval, or the escrow it became — rendered inside
 * the conversation it belongs to.
 *
 * The developer sees the exact terms — recipient, token, every milestone
 * amount and deadline — and signs them with their wallet. The signature covers
 * that structure, so the funder cannot afterwards change a number and still
 * present it as agreed.
 *
 * Two things are stated on the card rather than buried:
 *
 *   1. Signing costs nothing. No gas, no transaction, no access to tokens. An
 *      unexplained wallet prompt is what phishing looks like, so the prompt is
 *      explained before it appears.
 *   2. The signature is **not** enforced by the escrow contract. The contract
 *      has no notion of developer consent and anyone can deploy one directly.
 *      This is evidence of an agreement, not a lock on the funder.
 *
 * The card is also the way back into the form. Agreeing terms takes days, and
 * the funder who sent them has long since closed the tab; without a route back
 * they retype every amount from memory into a contract that cannot be amended.
 * "Create this escrow" reopens the form with these exact figures.
 */

/** Symbol, decimals and title, which only the proposal message carries. */
export interface ProposalDisplay {
  tokenSymbol: string;
  tokenDecimals: number;
  title: string;
}

export function ProposalCard({
  payload,
  account,
  display,
  onApprove,
}: {
  payload: EscrowPayload;
  account: string | null;
  /**
   * Display metadata recovered from the proposal in the same conversation.
   * An approval carries only the terms and the signature, because that is all
   * the signature covers — so amounts on an approval card are rendered using
   * what the proposal said, or not at all.
   */
  display?: ProposalDisplay;
  /** Posts the signed approval back into the room. */
  onApprove: (content: string) => Promise<void>;
}) {
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { terms } = payload;
  const isApproval = payload.kind === APPROVAL_MARKER;
  const isCreated = payload.kind === CREATED_MARKER;

  const symbol = 'tokenSymbol' in payload ? payload.tokenSymbol : (display?.tokenSymbol ?? '');
  const decimals =
    'tokenDecimals' in payload ? payload.tokenDecimals : (display?.tokenDecimals ?? 0);
  const title = 'title' in payload ? payload.title : (display?.title ?? '');

  const amounts = terms.milestones.map((milestone) => BigInt(milestone.amount));
  const total = amounts.reduce((sum, amount) => sum + amount, 0n);
  const fee = amounts.reduce((sum, amount) => sum + calculateFee(amount), 0n);

  const youAreDeveloper = isAddressEqual(account, terms.developer);
  const youAreFunder = isAddressEqual(account, terms.funder);

  // Re-verified here rather than trusted from the sender. A message claiming
  // to be an approval proves nothing on its own.
  const valid = isApproval
    ? verifyEscrowApproval(terms, (payload as ApprovalPayload).signature)
    : false;

  // The link back into the form needs the token's precision to turn base units
  // into the figures a person typed. Without it the amounts would be wrong by
  // orders of magnitude, so no link is offered.
  const reopenable: ProposalPayload | null =
    decimals > 0 || symbol
      ? { kind: PROPOSAL_MARKER, terms, tokenSymbol: symbol, tokenDecimals: decimals, title }
      : null;

  async function approve() {
    setSigning(true);
    setError(null);
    try {
      const signer = await getSigner();
      const signature = await signEscrowTerms(signer, terms);
      const approval: ApprovalPayload = { kind: APPROVAL_MARKER, terms, signature };
      await onApprove(encodePayload(approval));
    } catch (err) {
      setError(parseError(err, 'Not signed').message);
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="mt-1 max-w-xl rounded-lg border border-line bg-subtle p-4">
      <p className="flex flex-wrap items-center gap-2 text-secondary font-medium text-fg">
        {isCreated ? (
          <>
            <CircleCheck className="size-4 text-success-text" aria-hidden />
            Escrow created{title ? ` — ${title}` : ''}
          </>
        ) : isApproval ? (
          <>
            <CircleCheck
              className={valid ? 'size-4 text-success-text' : 'size-4 text-danger-text'}
              aria-hidden
            />
            {valid ? (
              <>
                Terms signed by <PersonName address={terms.developer} />
              </>
            ) : (
              'Approval does not verify'
            )}
          </>
        ) : (
          <>
            <ShieldQuestion className="size-4 text-fg-muted" aria-hidden />
            Escrow proposal{title ? ` — ${title}` : ''}
          </>
        )}
      </p>

      {isApproval && !valid && (
        <Alert tone="danger" title="Do not rely on this" className="mt-3">
          The signature does not match these terms and this address. It may have been
          altered after signing, or produced by a different wallet.
        </Alert>
      )}

      <dl className="mt-3 flex flex-col">
        <div className="flex items-baseline justify-between gap-4 py-1.5">
          <dt className="text-meta text-fg-muted">Paid to</dt>
          <dd>
            <Person address={terms.developer} chars={4} showExplorer={false} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-line-faint py-1.5">
          <dt className="text-meta text-fg-muted">Funded by</dt>
          <dd>
            <Person address={terms.funder} chars={4} showExplorer={false} />
          </dd>
        </div>
      </dl>

      <ol className="mt-2 border-t border-line pt-2">
        {terms.milestones.map((milestone, index) => (
          <li
            key={index}
            className="flex items-baseline justify-between gap-4 py-1.5 text-meta"
          >
            <span className="min-w-0 text-fg-secondary">
              <span className="mr-2 font-mono text-fg-muted">
                {String(index + 1).padStart(2, '0')}
              </span>
              {milestone.description}
              <span className="ml-2 text-fg-muted">
                {milestone.deadlineDays === '0'
                  ? 'no deadline'
                  : `${milestone.deadlineDays}d after funding`}
              </span>
            </span>
            <span className="shrink-0 font-mono text-code tabular-nums text-fg">
              {decimals ? formatTokenAmount(BigInt(milestone.amount), decimals) : milestone.amount}{' '}
              {symbol}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-2">
        <span className="text-meta text-fg-secondary">
          Developer receives, after the {Number(PROTOCOL.feeBasisPoints) / 100}% fee
        </span>
        <span className="shrink-0 font-mono text-code tabular-nums text-fg">
          {decimals ? formatTokenAmount(total - fee, decimals) : String(total - fee)} {symbol}
        </span>
      </div>

      {/* ------------------------------------------------------- the escrow */}

      {isCreated && (
        <div className="mt-4">
          <Link
            href={`/escrow/${(payload as { escrowAddress: string }).escrowAddress}`}
            className="inline-flex items-center gap-1.5 text-secondary text-accent-text hover:underline underline-offset-4"
          >
            Open the escrow
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
          <p className="mt-2 text-meta text-fg-muted">
            The contract states its own funder, developer, token and milestones. Read them
            there — this message is only a pointer to it.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------- signing */}

      {payload.kind === PROPOSAL_MARKER && youAreDeveloper && (
        <div className="mt-4">
          <Button
            size="sm"
            variant="primary"
            loading={signing}
            onClick={() => void approve()}
            leadingIcon={<FileSignature className="size-4" aria-hidden />}
          >
            Sign these terms
          </Button>
          {error && (
            <p role="alert" className="mt-2 text-meta text-danger-text">
              {error}
            </p>
          )}
          <DisclosureNote className="mt-3">
            Signing costs no gas, sends no transaction, and gives nobody access to your
            tokens. It records that you agreed to these exact amounts — change any of them
            and the signature stops matching.
          </DisclosureNote>
          <DisclosureNote className="mt-2" tone="caution">
            This does not bind the funder. The escrow contract cannot check for your
            approval, and they can deploy one without it. What you are signing is
            evidence of an agreement, not a lock.
          </DisclosureNote>
        </div>
      )}

      {/* -------------------------------------------- creating it, or not */}

      {!isCreated && youAreFunder && reopenable && (
        <div className="mt-4">
          <Link
            href={proposalHref(reopenable)}
            className="inline-flex items-center gap-1.5 text-secondary text-accent-text hover:underline underline-offset-4"
          >
            <SquarePen className="size-4" aria-hidden />
            {isApproval ? 'Create this escrow' : 'Open these terms in the form'}
          </Link>
          <p className="mt-2 text-meta text-fg-muted">
            Reopens the escrow form with these exact figures, so nothing has to be typed
            again. Nothing is sent until you review and confirm it.
          </p>
        </div>
      )}

      {!isCreated && !youAreFunder && isApproval && (
        <p className="mt-3 text-meta text-fg-muted">
          Signed. Only <PersonName address={terms.funder} /> can create the escrow — they
          deposit the funds, so it has to come from their wallet.
        </p>
      )}

      {payload.kind === PROPOSAL_MARKER && !youAreFunder && !youAreDeveloper && (
        <p className="mt-3 text-meta text-fg-muted">
          Waiting for <PersonName address={terms.developer} /> to sign. Only that wallet
          can.
        </p>
      )}
    </div>
  );
}
