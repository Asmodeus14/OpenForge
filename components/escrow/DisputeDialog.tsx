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

        {/* The single most important fact about this action, and the one the
            contract gives no way to walk back. */}
        <DisclosureNote tone="caution">
          A dispute cannot be withdrawn. There is no way back to normal operation — no
          further milestone can ever be released, and neither side can cancel a single
          milestone again. The escrow can now only end in one of two ways: everything
          remaining goes to the funder, or everything remaining goes to the developer.
        </DisclosureNote>

        <DisclosureNote>
          This reason is stored on the blockchain permanently and is public. It cannot be
          edited or deleted afterwards.
        </DisclosureNote>

        <DisclosureNote tone="caution">
          {role === 'developer'
            ? `The funder can end this dispute in their own favour and reclaim the escrow immediately. You cannot claim the funds until ${formatDuration(PROTOCOL.disputeTimeoutSeconds)} have passed. Raising a dispute does not protect your payment.`
            : `You can end this dispute in your own favour and reclaim the escrow immediately. The developer cannot claim the funds until ${formatDuration(PROTOCOL.disputeTimeoutSeconds)} have passed.`}
        </DisclosureNote>
      </div>
    </Dialog>
  );
}
