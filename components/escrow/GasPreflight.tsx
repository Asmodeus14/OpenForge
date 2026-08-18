'use client';

import { Alert, Skeleton } from '@/components/ui/States';
import { DisclosureNote } from '@/components/trust/Trust';
import { DEFAULT_CHAIN } from '@/chain/config';
import type { GasPreflight as GasPreflightData } from '@/chain/gas';
import { formatCount, formatTokenAmount } from '@/lib/format';

/**
 * What the four transactions will cost to send.
 *
 * Creating an escrow is a sequence, and every step needs native currency.
 * Discovering that halfway through leaves a deployed contract holding nothing
 * — not a loss of funds, but a wasted deployment that has to be redone.
 *
 * Two steps are priced exactly and two cannot be priced at all until the
 * contract exists. Rather than filling the gap with a plausible-looking
 * number, the unpriceable ones say so and say why. The total is therefore
 * labelled a floor, and the verdict is one-directional: this can tell you the
 * balance is definitely too low, never that it is definitely enough.
 */

const NATIVE_DECIMALS = 18;

function costOf(gas: bigint, gasPrice: bigint): string {
  return formatTokenAmount(gas * gasPrice, NATIVE_DECIMALS, { maxFractionDigits: 6 });
}

export function GasPreflight({
  data,
  isPending,
  isError,
}: {
  data?: GasPreflightData;
  isPending: boolean;
  isError: boolean;
}) {
  if (isError) {
    return (
      <DisclosureNote className="mt-5">
        The network fee could not be estimated just now. That does not block anything —
        your wallet will still show the exact fee before you confirm each step.
      </DisclosureNote>
    );
  }

  if (isPending || !data) {
    return (
      <div className="mt-5 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
      </div>
    );
  }

  const priced = data.steps.filter((step) => step.gas !== null);
  const unpriced = data.steps.filter((step) => step.gas === null);

  return (
    <div className="mt-6">
      <h3 className="text-micro uppercase tracking-wide text-fg-muted">Network fees</h3>

      <ul className="mt-2.5">
        {data.steps.map((step) => (
          <li
            key={step.key}
            className="flex items-baseline justify-between gap-4 border-t border-line-faint py-2 first:border-t-0"
          >
            <span className="min-w-0 text-meta text-fg-secondary">{step.label}</span>
            <span className="shrink-0 font-mono text-code tabular-nums text-fg">
              {step.gas === null ? (
                <span className="text-fg-muted">not yet</span>
              ) : (
                `${formatCount(Number(step.gas))} gas`
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <span className="text-meta text-fg-secondary">
          {priced.length === data.steps.length ? 'Total' : 'At least'}
          <span className="ml-1 text-fg-muted">
            · {formatTokenAmount(data.gasPrice, 9, { maxFractionDigits: 2 })} gwei
          </span>
        </span>
        <span className="shrink-0 font-mono text-code tabular-nums text-fg">
          {costOf(data.knownGas, data.gasPrice)} {DEFAULT_CHAIN.nativeSymbol}
        </span>
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-4">
        <span className="text-meta text-fg-muted">Your balance</span>
        <span className="shrink-0 font-mono text-code tabular-nums text-fg-secondary">
          {formatTokenAmount(data.balance, NATIVE_DECIMALS, { maxFractionDigits: 6 })}{' '}
          {DEFAULT_CHAIN.nativeSymbol}
        </span>
      </div>

      {data.definitelyInsufficient ? (
        <Alert tone="warning" title="Not enough for gas" className="mt-4">
          Your wallet cannot cover even the steps that could be priced, so this sequence
          would stop partway. Top up before starting — a deployment that runs out after
          the first transaction has to be started again from scratch.
        </Alert>
      ) : (
        unpriced.length > 0 && (
          <DisclosureNote className="mt-4">
            {unpriced.length} of the {data.steps.length} steps cannot be priced until the
            contract exists — the registry and the deposit both call a contract that is
            not deployed yet. The figure above is a floor, not a total. Gas prices also
            move between blocks, so leave some headroom.
          </DisclosureNote>
        )
      )}
    </div>
  );
}
