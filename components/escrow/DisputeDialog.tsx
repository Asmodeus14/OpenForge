'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Input';
import { DisclosureNote } from '@/components/trust/Trust';
import { PROTOCOL } from '@/chain/config';
import { formatDuration } from '@/lib/format';

/**
 * Collects the reason for a dispute.
 *
 * This replaces a `window.prompt()`. The reason is written to the blockchain
 * permanently and the act of raising a dispute ends the escrow's working
 * life, so it deserves more than an unstyled browser box with no explanation
 * of what pressing OK does.
 *
 * The asymmetry between the two roles is stated here, before the reason is
 * even typed, and phrased from the reader's own position — the developer is
 * told they are the disadvantaged party, because they are.
 *
 * The finality is stated too, because it is worse than it looks. There is no
 * `withdrawDispute` in the contract, and no path from `Disputed` back to
 * `Funded`. The only exits are `resolveDisputeToFunder` (everything left goes
 * to the funder, immediately) and `resolveDisputeToDeveloper` (everything left
 * goes to the developer, after 30 days). Both are terminal states. Raising a
 * dispute is therefore not "pausing" anything — it permanently ends
 * milestone-by-milestone work and forces the project to end all-or-nothing.
 */

export const DISPUTE_REASON_MAX = 500;

export function DisputeDialog({
  open,
  onOpenChange,
  role,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'funder' | 'developer';
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmed = reason.trim();
  const error = touched && trimmed.length < 10 ? 'Describe the problem in at least 10 characters.' : undefined;

  function close(next: boolean) {
    if (!next) {
      setReason('');
      setTouched(false);
    }
    onOpenChange(next);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Raise a dispute"
      description="This cannot be undone, and it permanently ends milestone releases."
      footer={
        <>
          <Button variant="ghost" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setTouched(true);
              if (trimmed.length < 10) return;
              onSubmit(trimmed);
              close(false);
            }}
          >
            Review dispute
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Textarea
          label="What is the problem?"
          required
          rows={5}
          value={reason}
          maxLength={DISPUTE_REASON_MAX}
          showCount
          error={error}
          onChange={(event) => setReason(event.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Describe what was agreed, what was delivered, and where they differ."
        />

        {/* What a dispute is for, stated before what it costs — the intuitive
            reading, that this freezes everything or decides something, is
            wrong in both directions. */}
        <DisclosureNote>
          A dispute freezes the funder&rsquo;s ability to reclaim overdue milestones for{' '}
          {formatDuration(PROTOCOL.disputeWindowSeconds)}, then lapses on its own. It does
          not pause releases: paying the developer is never blocked.
        </DisclosureNote>

        <DisclosureNote tone="caution">
          It awards nothing to anybody. There is no arbitrator, so this moves no money and
          decides no outcome — it buys time to settle between yourselves.
        </DisclosureNote>

        <DisclosureNote>
          {role === 'developer'
            ? 'You can raise one dispute on this escrow, and you can withdraw it early if you reach agreement. Use it when a deadline is close and you need the funder not to withdraw while you settle.'
            : 'You can raise one dispute on this escrow, and you can withdraw it early. Note it freezes your own ability to reclaim, so it is of most use to the developer.'}
        </DisclosureNote>

        <DisclosureNote>
          This reason is emitted to the blockchain permanently and is public. It cannot be
          edited or deleted afterwards.
        </DisclosureNote>
      </div>
    </Dialog>
  );
}
