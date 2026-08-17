/**
 * The transaction lifecycle primitive.
 *
 * Every write path in the application goes through this hook. It is what
 * guarantees the trust behaviour the product requires:
 *
 *  - Nothing is signed until the user has seen WHAT, WHO, HOW MUCH and WHERE.
 *  - Irreversible actions say so, before the wallet opens.
 *  - Action labels are explicit ("Release 1,182 tUSDC"), never "Continue".
 *  - Multi-transaction flows are shown as discrete steps, not hidden behind
 *    a single spinner.
 *  - Failure states state plainly whether funds moved, and never claim funds
 *    are safe when we cannot know that.
 */

import { useCallback, useRef, useState } from 'react';
import type { ContractTransactionResponse, Signer } from 'ethers';
import { getSigner } from '../chain/clients';
import { fundsCertainlyUnmoved, parseError, type ParsedError } from '../lib/errors';

export type TxKind =
  /** An off-chain signature. Costs nothing, moves nothing. */
  | 'sign'
  /** Grants a contract permission to spend tokens. Does not transfer them. */
  | 'approve'
  /** Deploys a new contract. Costs gas. */
  | 'deploy'
  /** A state-changing call. May move funds. */
  | 'send';

export interface TxFact {
  label: string;
  value: string;
  /** Addresses, hashes and amounts render in the mono face. */
  mono?: boolean;
  /** The single most important fact — usually the amount. */
  emphasis?: boolean;
  href?: string;
}

export interface TxStep {
  /** Imperative and specific: "Approve 1,200 tUSDC", not "Approve". */
  label: string;
  kind: TxKind;
  /** One line explaining what this step does and why it is needed. */
  description?: string;
  /**
   * Performs the step. Return the transaction to wait for confirmation, or
   * nothing for steps that produce no transaction.
   */
  run: (signer: Signer) => Promise<ContractTransactionResponse | void>;
}

export interface TxIntent {
  /** Heading for the confirmation dialog, e.g. "Release milestone 2". */
  title: string;
  /** The primary button label. Must name the actual consequence. */
  actionLabel: string;
  /** Renders the "cannot be undone" treatment and copy. */
  irreversible?: boolean;
  /** WHAT / WHO / HOW MUCH / WHERE. Shown before signing and after completion. */
  facts: TxFact[];
  /** Material consequences the user should know: fees, asymmetries, locks. */
  disclosures?: string[];
  /**
   * Shown on failure when we know nothing moved, e.g.
   * "Your funds have NOT been released."
   */
  failureReassurance?: string;
  /** Shown on success, e.g. "1,182 tUSDC has been sent to the developer." */
  successSummary?: string;
  steps: TxStep[];
}

export type TxPhase =
  | 'idle'
  /** Confirmation dialog is open; nothing has been sent. */
  | 'confirming'
  /** At least one step is in flight. */
  | 'running'
  | 'success'
  | 'error';

/** Where an individual step has got to. */
export type StepPhase = 'waiting' | 'signing' | 'pending' | 'confirmed' | 'failed';

export interface TxStepState {
  phase: StepPhase;
  hash?: string;
}

export interface TxState {
  phase: TxPhase;
  intent?: TxIntent;
  steps: TxStepState[];
  currentStep: number;
  error?: ParsedError;
  /**
   * True when at least one transaction was broadcast. Drives whether the
   * failure state may reassure the user that nothing happened.
   */
  broadcast: boolean;
}

const IDLE: TxState = { phase: 'idle', steps: [], currentStep: 0, broadcast: false };

export interface UseTransactionOptions {
  /** Called once every step has confirmed. Use it to invalidate queries. */
  onSuccess?: () => void;
}

export function useTransaction(options: UseTransactionOptions = {}) {
  const [state, setState] = useState<TxState>(IDLE);
  const onSuccessRef = useRef(options.onSuccess);
  onSuccessRef.current = options.onSuccess;

  /** Opens the confirmation dialog. Sends nothing. */
  const start = useCallback((intent: TxIntent) => {
    setState({
      phase: 'confirming',
      intent,
      steps: intent.steps.map(() => ({ phase: 'waiting' as const })),
      currentStep: 0,
      broadcast: false,
    });
  }, []);

  const cancel = useCallback(() => setState(IDLE), []);

  const reset = useCallback(() => setState(IDLE), []);

  /** Proceeds past the confirmation dialog and executes every step in order. */
  const confirm = useCallback(async () => {
    let intent: TxIntent | undefined;
    setState((prev) => {
      intent = prev.intent;
      return prev.intent ? { ...prev, phase: 'running' } : prev;
    });
    if (!intent) return;

    let broadcast = false;

    try {
      const signer = await getSigner();

      for (let i = 0; i < intent.steps.length; i += 1) {
        const step = intent.steps[i];

        // Waiting on the user's wallet.
        setState((prev) => ({
          ...prev,
          currentStep: i,
          steps: prev.steps.map((s, idx) => (idx === i ? { phase: 'signing' } : s)),
        }));

        const tx = await step.run(signer);

        if (tx) {
          broadcast = true;
          setState((prev) => ({
            ...prev,
            broadcast: true,
            steps: prev.steps.map((s, idx) =>
              idx === i ? { phase: 'pending', hash: tx.hash } : s,
            ),
          }));

          const receipt = await tx.wait();
          // ethers resolves with status 0 for a mined-but-reverted transaction.
          if (receipt && receipt.status === 0) {
            throw new Error(`Transaction reverted: ${tx.hash}`);
          }
        }

        setState((prev) => ({
          ...prev,
          steps: prev.steps.map((s, idx) =>
            idx === i ? { ...s, phase: 'confirmed' } : s,
          ),
        }));
      }

      setState((prev) => ({ ...prev, phase: 'success' }));
      onSuccessRef.current?.();
    } catch (error) {
      const parsed = parseError(error, intent.title);
      setState((prev) => ({
        ...prev,
        phase: 'error',
        error: parsed,
        broadcast,
        steps: prev.steps.map((s, idx) =>
          idx === prev.currentStep && s.phase !== 'confirmed'
            ? { ...s, phase: 'failed' }
            : s,
        ),
      }));
    }
  }, []);

  /**
   * Whether it is honest to tell the user nothing happened.
   *
   * Requires BOTH that the failure kind rules out a state change AND that no
   * earlier step in the sequence already confirmed. If an approval succeeded
   * and the funding call then failed, something did change on-chain and the
   * UI must not claim otherwise.
   */
  const canReassure =
    state.phase === 'error' &&
    !!state.error &&
    fundsCertainlyUnmoved(state.error.kind) &&
    !state.steps.some((s) => s.phase === 'confirmed');

  return {
    state,
    /** Steps that completed before the failure — always disclosed on error. */
    completedSteps: state.steps.filter((s) => s.phase === 'confirmed').length,
    canReassure,
    isBusy: state.phase === 'running',
    start,
    confirm,
    cancel,
    reset,
  };
}

export type UseTransactionResult = ReturnType<typeof useTransaction>;
