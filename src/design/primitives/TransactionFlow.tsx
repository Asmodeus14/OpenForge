/**
 * The user-facing half of `useTransaction`.
 *
 * One component renders the entire lifecycle — confirm, sign, pending,
 * confirmed, failed — so every money action in the product behaves
 * identically and no page can invent its own weaker version.
 */

import {
  Check,
  CircleAlert,
  CircleCheck,
  Loader2,
  ShieldAlert,
  X,
} from 'lucide-react';
import { cn } from '../cn';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { DisclosureNote, FactList, TxHashDisplay } from './Trust';
import type { StepPhase, UseTransactionResult } from '../../hooks/useTransaction';

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
      return <span className="size-1.5 rounded-full bg-fg-subtle" aria-hidden />;
  }
}

const PHASE_LABEL: Record<StepPhase, string> = {
  waiting: 'Waiting',
  signing: 'Confirm in your wallet',
  pending: 'Submitted, waiting for the network',
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

  const title = isSuccess
    ? 'Completed'
    : isError
      ? (state.error?.title ?? 'Did not complete')
      : intent.title;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) (isSuccess || isError ? tx.reset : tx.cancel)();
      }}
      // A transaction in flight must not be dismissable — closing mid-flow
      // would leave the user with no record of what they just signed.
      dismissible={!isRunning}
      title={title}
      size={multiStep ? 'lg' : 'md'}
      footer={
        isConfirming ? (
          <>
            <Button variant="ghost" onClick={tx.cancel}>
              Cancel
            </Button>
            <Button
              variant={intent.irreversible ? 'danger' : 'primary'}
              onClick={tx.confirm}
            >
              {intent.actionLabel}
            </Button>
          </>
        ) : isRunning ? (
          <p className="text-meta text-fg-subtle">
            Do not close this window until the transaction is confirmed.
          </p>
        ) : (
          <Button variant={isSuccess ? 'primary' : 'secondary'} onClick={tx.reset}>
            {isSuccess ? 'Done' : 'Close'}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {/* ---- Outcome banner, stated before any detail. */}
        {isSuccess && (
          <div className="flex items-start gap-2.5 rounded-md border border-success-line bg-success-subtle px-3 py-2.5">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-text" aria-hidden />
            <p className="text-secondary text-fg">
              {intent.successSummary ?? 'The transaction was confirmed on Sepolia.'}
            </p>
          </div>
        )}

        {isError && state.error && (
          <div className="flex items-start gap-2.5 rounded-md border border-danger-line bg-danger-subtle px-3 py-2.5">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger-text" aria-hidden />
            <div className="min-w-0">
              <p className="text-secondary text-fg">{state.error.message}</p>

              {/* Only reassure when we genuinely know nothing landed. */}
              {tx.canReassure && intent.failureReassurance && (
                <p className="mt-1.5 text-secondary font-medium text-fg">
                  {intent.failureReassurance}
                </p>
              )}

              {/* If earlier steps DID confirm, say so — the state changed. */}
              {tx.completedSteps > 0 && (
                <p className="mt-1.5 text-secondary text-fg-muted">
                  {tx.completedSteps} of {intent.steps.length} steps completed before
                  this failure. Those transactions are on-chain and were not reverted.
                </p>
              )}

              {state.error.kind === 'network' && (
                <p className="mt-1.5 text-secondary text-fg-muted">
                  Check the block explorer before retrying, to avoid sending the same
                  transaction twice.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ---- Irreversibility warning, before the facts, before signing. */}
        {isConfirming && intent.irreversible && (
          <div className="flex items-start gap-2.5 rounded-md border border-warning-line bg-warning-subtle px-3 py-2.5">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning-text" aria-hidden />
            <p className="text-secondary text-fg">
              This action cannot be undone.
            </p>
          </div>
        )}

        {/* ---- WHAT / WHO / HOW MUCH / WHERE. Always shown, in every phase. */}
        <FactList facts={intent.facts} />

        {/* ---- Material consequences: fees, locks, asymmetries. */}
        {intent.disclosures?.map((note) => (
          <DisclosureNote key={note}>{note}</DisclosureNote>
        ))}

        {/* ---- Step progress. Shown for multi-transaction flows so the user
                knows exactly how many wallet prompts to expect. */}
        {(multiStep || isRunning) && (
          <ol className="flex flex-col gap-1.5">
            {intent.steps.map((step, i) => {
              const stepState = state.steps[i];
              const active = i === state.currentStep && isRunning;

              return (
                <li
                  key={step.label}
                  className={cn(
                    'flex items-start gap-2.5 rounded-md border px-3 py-2',
                    active ? 'border-accent-line bg-accent-subtle' : 'border-line',
                  )}
                >
                  <span className="mt-1 flex size-3.5 shrink-0 items-center justify-center">
                    <StepIcon phase={stepState?.phase ?? 'waiting'} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-secondary text-fg">
                      {multiStep && (
                        <span className="text-fg-subtle tabular-nums">{i + 1}. </span>
                      )}
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="mt-0.5 text-meta text-fg-subtle">{step.description}</p>
                    )}
                    {stepState?.phase && stepState.phase !== 'waiting' && (
                      <p className="mt-1 text-meta text-fg-muted">
                        {PHASE_LABEL[stepState.phase]}
                      </p>
                    )}
                    {stepState?.hash && (
                      <TxHashDisplay hash={stepState.hash} className="mt-1" />
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
