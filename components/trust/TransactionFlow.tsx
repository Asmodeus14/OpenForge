'use client';

import { Check, CircleAlert, CircleCheck, Loader2, ShieldAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { DisclosureNote, FactList, TxHashDisplay } from './Trust';
import type { StepPhase, UseTransactionResult } from '@/hooks/useTransaction';

/**
 * The user-facing half of `useTransaction`.
 *
 * One component renders the whole lifecycle — confirm, sign, pending,
 * confirmed, failed — so every action involving money behaves identically
 * and no page can invent a weaker version of it.
 *
 * The rules it enforces:
 *  - nothing is signed before the user has seen what / who / how much / where
 *  - irreversible actions say so, before the wallet opens
 *  - the action button names the consequence, never "Continue"
 *  - multi-transaction flows show every step, so the number of wallet
 *    prompts is never a surprise
 *  - on failure it only claims nothing happened when that is actually known
 */

function StepIcon({ phase }: { phase: StepPhase }) {
  switch (phase) {
    case 'confirmed':
      return <Check className="size-3.5 text-success-text" aria-hidden />;
    case 'signing':
    case 'pending':
      return <Loader2 className="size-3.5 animate-spin text-accent-text" aria-hidden />;
    case 'failed':
      return <X className="size-3.5 text-danger-text" aria-hidden />;
    default:
      return <span className="size-1.5 rounded-full bg-fg-muted" aria-hidden />;
  }
}

const PHASE_LABEL: Record<StepPhase, string> = {
  waiting: 'Waiting',
  signing: 'Confirm in your wallet',
  pending: 'Submitted — waiting for the network',
  confirmed: 'Confirmed',
  failed: 'Failed',
};

export function TransactionFlow({ tx }: { tx: UseTransactionResult }) {
  const { state } = tx;
  const intent = state.intent;
  if (!intent || state.phase === 'idle') return null;

  const isConfirming = state.phase === 'confirming';
  const isRunning = state.phase === 'running';
  const isSuccess = state.phase === 'success';
  const isError = state.phase === 'error';
  const multiStep = intent.steps.length > 1;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) (isSuccess || isError ? tx.reset : tx.cancel)();
      }}
      // A transaction in flight must not be dismissable: closing mid-flow
      // would leave the user with no record of what they just signed.
      dismissible={!isRunning}
      title={
        isSuccess ? 'Completed' : isError ? (state.error?.title ?? 'Did not complete') : intent.title
      }
      size={multiStep ? 'lg' : 'md'}
      footer={
        isConfirming ? (
          <>
            <Button variant="ghost" onClick={tx.cancel}>
              Cancel
            </Button>
            <Button variant={intent.irreversible ? 'danger' : 'primary'} onClick={tx.confirm}>
              {intent.actionLabel}
            </Button>
          </>
        ) : isRunning ? (
          <p className="text-meta text-fg-muted">
            Keep this window open until the transaction is confirmed.
          </p>
        ) : (
          <Button variant={isSuccess ? 'primary' : 'secondary'} onClick={tx.reset}>
            {isSuccess ? 'Done' : 'Close'}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-5">
        {isSuccess && (
          <div className="flex items-start gap-3 rounded-lg border border-success-line bg-success-subtle px-4 py-3">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-text" aria-hidden />
            <p className="text-secondary text-fg">
              {intent.successSummary ?? 'The transaction was confirmed on Sepolia.'}
            </p>
          </div>
        )}

        {isError && state.error && (
          <div className="flex items-start gap-3 rounded-lg border border-danger-line bg-danger-subtle px-4 py-3">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger-text" aria-hidden />
            <div className="min-w-0">
              <p className="text-secondary text-fg">{state.error.message}</p>

              {/* Only reassure when nothing can have landed. */}
              {tx.canReassure && intent.failureReassurance && (
                <p className="mt-2 text-secondary font-medium text-fg">
                  {intent.failureReassurance}
                </p>
              )}

              {/* If earlier steps confirmed, say so — state did change. */}
              {tx.completedSteps > 0 && (
                <p className="mt-2 text-secondary text-fg-secondary">
                  {tx.completedSteps} of {intent.steps.length} steps completed before this
                  failure. Those transactions are on chain and were not reverted.
                </p>
              )}

              {state.error.kind === 'network' && (
                <p className="mt-2 text-secondary text-fg-secondary">
                  Check the block explorer before retrying, so you do not send the same
                  transaction twice.
                </p>
              )}
            </div>
          </div>
        )}

        {isConfirming && intent.irreversible && (
          <div className="flex items-start gap-3 rounded-lg border border-warning-line bg-warning-subtle px-4 py-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning-text" aria-hidden />
            <p className="text-secondary text-fg">This action cannot be undone.</p>
          </div>
        )}

        {/* Shown in every phase, so the completion record matches the
            agreement exactly. */}
        <FactList facts={intent.facts} />

        {intent.disclosures?.map((note) => <DisclosureNote key={note}>{note}</DisclosureNote>)}

        {(multiStep || isRunning) && (
          <ol className="flex flex-col gap-2">
            {intent.steps.map((step, index) => {
              const stepState = state.steps[index];
              const active = index === state.currentStep && isRunning;

              return (
                <li
                  key={step.label}
                  className={cn(
                    'flex items-start gap-3 rounded-md border px-3.5 py-3 transition-colors',
                    active ? 'border-accent-line bg-accent-subtle' : 'border-line',
                  )}
                >
                  <span className="mt-1 flex size-3.5 shrink-0 items-center justify-center">
                    <StepIcon phase={stepState?.phase ?? 'waiting'} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-secondary text-fg">
                      {multiStep && (
                        <span className="tabular-nums text-fg-muted">{index + 1}. </span>
                      )}
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="mt-0.5 text-meta text-fg-muted">{step.description}</p>
                    )}
                    {stepState?.phase && stepState.phase !== 'waiting' && (
                      <p className="mt-1.5 text-meta text-fg-secondary">
                        {PHASE_LABEL[stepState.phase]}
                      </p>
                    )}
                    {stepState?.hash && (
                      <TxHashDisplay hash={stepState.hash} className="mt-1.5" />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Dialog>
  );
}
