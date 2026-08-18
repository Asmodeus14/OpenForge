'use client';

import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/States';
import { DEFAULT_CHAIN } from '@/chain/config';
import { useEscrowHoldings, useNativeBalance, useTokenBalances } from '@/hooks/queries';
import { formatCompactNumber, formatTokenAmount } from '@/lib/format';

/**
 * What this wallet holds.
 *
 * Balances are read from the chain with the app's own read provider rather
 * than asked of the wallet extension, so the figures here are the same ones
 * the contracts will see — a wallet's own UI can lag, and on a testnet it
 * frequently does.
 *
 * Every query is gated on `enabled` so opening the app costs nothing; the
 * reads happen when the menu is actually opened.
 *
 * Only real balances appear. There is no fiat conversion, because these are
 * testnet tokens with no price, and printing "$1,200" next to them would be
 * an invention.
 */

const NATIVE_DECIMALS = 18;
/** Enough to see a balance change without a wall of digits. */
const NATIVE_DISPLAY_DIGITS = 5;
/** Above this, the exact figure stops fitting in a menu. */
const COMPACT_ABOVE = 1e9;

/**
 * A readable balance for this panel, and this panel only.
 *
 * Test-token balances are routinely absurd — the deployer wallet holds 10^21
 * tUSDC, which is 25 characters once grouped and would either overflow the
 * menu or be truncated into a number that reads as a much smaller one.
 * Compacting is the honest way out: "1000000000T" is obviously an
 * approximation in a way that "1,000,000,000,00…" is not, and the exact value
 * stays on the element for anyone who hovers or uses a screen reader.
 *
 * Deliberately local. This must never be reached for by a confirmation
 * dialog, where the displayed figure has to be the figure being agreed to.
 */
function balanceDisplay(
  amount: bigint,
  decimals: number,
  maxFractionDigits?: number,
): { text: string; exact: string } {
  const exact = formatTokenAmount(amount, decimals);
  const whole = Number(amount / 10n ** BigInt(decimals));

  return {
    text:
      whole >= COMPACT_ABOVE
        ? formatCompactNumber(whole)
        : formatTokenAmount(amount, decimals, { maxFractionDigits }),
    exact,
  };
}

function Row({
  label,
  value,
  exact,
  hint,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  /** The unabbreviated figure, when `value` is a rounded stand-in. */
  exact?: string;
  hint?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="min-w-0 truncate text-meta text-fg-secondary">
        {label}
        {hint && <span className="ml-1.5 text-fg-muted">{hint}</span>}
      </span>
      <span
        title={exact}
        aria-label={exact ? `${label}: ${exact}` : undefined}
        className={cn(
          'shrink-0 font-mono text-code tabular-nums',
          muted ? 'text-fg-secondary' : 'text-fg',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function WalletAssets({
  address,
  enabled = true,
}: {
  address: string;
  enabled?: boolean;
}) {
  const native = useNativeBalance(address, enabled);
  const tokens = useTokenBalances(address, enabled);
  const holdings = useEscrowHoldings(address, enabled);

  const loadingBalances = native.isPending || tokens.isPending;
  const outOfGas = native.data !== undefined && native.data === 0n;

  const anyHoldings = (holdings.data?.length ?? 0) > 0;

  // Only tokens actually held. Listing every currency the escrow accepts
  // would fill the menu with zeros and bury the one line that matters. If
  // nothing is held at all, the first configured token stands in so the
  // section still says something rather than vanishing.
  const held = tokens.data?.filter(({ balance }) => balance > 0n) ?? [];
  const tokenRows = held.length > 0 ? held : tokens.data?.slice(0, 1) ?? [];

  return (
    <div>
      <p className="text-micro uppercase tracking-wide text-fg-muted">Assets</p>

      <div className="mt-1.5">
        {loadingBalances ? (
          <div className="flex flex-col gap-2 py-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
          </div>
        ) : (
          <>
            <Row
              label={DEFAULT_CHAIN.nativeSymbol}
              hint="gas"
              value={
                native.data === undefined
                  ? '—'
                  : balanceDisplay(native.data, NATIVE_DECIMALS, NATIVE_DISPLAY_DIGITS).text
              }
              exact={
                native.data === undefined
                  ? undefined
                  : balanceDisplay(native.data, NATIVE_DECIMALS).exact
              }
            />

            {tokenRows.map(({ token, balance }) => {
              const display = balanceDisplay(balance, token.decimals);
              return (
                <Row
                  key={token.address}
                  label={token.symbol}
                  value={display.text}
                  exact={`${display.exact} ${token.symbol}`}
                />
              );
            })}
          </>
        )}
      </div>

      {/* A deploy needs gas before it needs tokens, so this is the block that
          actually stops someone — worth saying here rather than at the point
          the wallet rejects the transaction. */}
      {outOfGas && (
        <p className="mt-1.5 text-meta text-warning-text">
          No {DEFAULT_CHAIN.nativeSymbol} for gas — no transaction can be sent.{' '}
          <a
            href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 underline underline-offset-4"
          >
            Get some
            <ExternalLink className="size-3" aria-hidden />
          </a>
        </p>
      )}

      {anyHoldings && (
        <div className="mt-3 border-t border-line-faint pt-2.5">
          <p className="text-micro uppercase tracking-wide text-fg-muted">In escrow</p>

          <div className="mt-1.5">
            {holdings.data?.map((holding) => {
              const locked = balanceDisplay(holding.lockedAsFunder, holding.token.decimals);
              const committed = balanceDisplay(
                holding.committedToYou,
                holding.token.decimals,
              );

              return (
                <div key={holding.token.address}>
                  {holding.lockedAsFunder > 0n && (
                    <Row
                      label="Locked as funder"
                      muted
                      value={`${locked.text} ${holding.token.symbol}`}
                      exact={`${locked.exact} ${holding.token.symbol}`}
                    />
                  )}
                  {holding.committedToYou > 0n && (
                    <Row
                      label="Committed to you"
                      muted
                      value={`${committed.text} ${holding.token.symbol}`}
                      exact={`${committed.exact} ${holding.token.symbol}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Committed is not earned. Saying so here prevents the number above
              from reading as a balance the developer can spend. */}
          <p className="mt-1.5 text-meta text-fg-muted">
            Committed amounts are net of the fee and are only paid once the funder
            releases each milestone.
          </p>
        </div>
      )}
    </div>
  );
}
