/**
 * Trust primitives.
 *
 * These components exist so that identity, money and network are always
 * presented the same way, with the same verifiability, everywhere in the
 * product. Pages must never hand-render an address or a token amount.
 */

import { useState, type ReactNode } from 'react';
import { Check, Copy, ExternalLink, Info } from 'lucide-react';
import { cn } from '../cn';
import {
  DEFAULT_CHAIN,
  explorerAddressUrl,
  explorerTxUrl,
  getChain,
} from '../../chain/config';
import { formatTokenAmount, shortenAddress, shortenHash } from '../../lib/format';
import type { TokenInfo } from '../../chain/config';
import type { TxFact } from '../../hooks/useTransaction';

/* ------------------------------------------------------------------ copy */

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className="text-fg-subtle transition-colors duration-[var(--dur-hover)] hover:text-fg"
      onClick={async (event) => {
        event.stopPropagation();
        event.preventDefault();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard can be blocked by permissions; failing silently is
          // correct here — the full value is already visible on screen.
        }
      }}
    >
      {copied ? (
        <Check className="size-3.5 text-success-text" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  );
}

/* --------------------------------------------------------------- identity */

/**
 * An on-chain address: monospaced, truncated, copyable, and linked to a block
 * explorer so the user can always verify who they are dealing with.
 *
 * The full address is exposed to assistive tech and on hover — truncation is
 * a display convenience, never a hiding of information.
 */
export function AddressDisplay({
  address,
  chainId = DEFAULT_CHAIN.chainId,
  label,
  chars = 4,
  showCopy = true,
  showExplorer = true,
  className,
}: {
  address: string;
  chainId?: number;
  /** Optional human name shown alongside, e.g. a profile name. */
  label?: string;
  chars?: number;
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
}) {
  const href = explorerAddressUrl(chainId, address);

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {label && <span className="text-secondary text-fg">{label}</span>}
      <span
        className="font-mono text-code text-fg-muted"
        title={address}
        aria-label={`Address ${address}`}
      >
        {shortenAddress(address, chars)}
      </span>
      {showCopy && <CopyButton value={address} label="address" />}
      {showExplorer && href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="View address on block explorer"
          className="text-fg-subtle transition-colors duration-[var(--dur-hover)] hover:text-accent-text"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      )}
    </span>
  );
}

/** A transaction hash with an explorer link. Used in every terminal tx state. */
export function TxHashDisplay({
  hash,
  chainId = DEFAULT_CHAIN.chainId,
  className,
}: {
  hash: string;
  chainId?: number;
  className?: string;
}) {
  const href = explorerTxUrl(chainId, hash);

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="font-mono text-code text-fg-muted" title={hash}>
        {shortenHash(hash)}
      </span>
      <CopyButton value={hash} label="transaction hash" />
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-code text-accent-text hover:underline underline-offset-4"
        >
          View transaction
          <ExternalLink className="size-3" aria-hidden />
        </a>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ money */

/**
 * A token amount. The symbol is never omitted and the decimals are always
 * the token's real decimals — tUSDC is 6, and rendering it as 18 misstates
 * the value by a factor of a trillion.
 */
export function TokenAmount({
  amount,
  token,
  emphasis,
  className,
}: {
  amount: bigint;
  token: Pick<TokenInfo, 'symbol' | 'decimals'>;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-mono whitespace-nowrap tabular-nums',
        emphasis ? 'text-heading text-fg' : 'text-code text-fg',
        className,
      )}
    >
      {formatTokenAmount(amount, token.decimals)}
      <span className={cn('ml-1', emphasis ? 'text-fg-muted' : 'text-fg-subtle')}>
        {token.symbol}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------- network */

/**
 * Persistent network indicator.
 *
 * OpenForge is deployed only to Sepolia, and its own documentation says not
 * to use real funds. Saying so calmly and permanently is more trustworthy
 * than hiding it — and prevents someone assuming these are real balances.
 */
export function NetworkBadge({
  chainId,
  className,
}: {
  chainId?: number | null;
  className?: string;
}) {
  const chain = getChain(chainId ?? DEFAULT_CHAIN.chainId);
  const unsupported = chainId !== null && chainId !== undefined && !chain;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-meta',
        unsupported
          ? 'border-warning-line bg-warning-subtle text-warning-text'
          : 'border-line bg-raised text-fg-muted',
        className,
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          unsupported ? 'bg-warning' : 'bg-success',
        )}
        aria-hidden
      />
      {unsupported ? 'Unsupported network' : (chain?.label ?? DEFAULT_CHAIN.label)}
    </span>
  );
}

/* ------------------------------------------------------------------ facts */

/**
 * The WHAT / WHO / HOW MUCH / WHERE block (§11).
 *
 * Shown before signing and repeated after completion, so the record of what
 * happened matches exactly what was agreed to.
 */
export function FactList({
  facts,
  className,
}: {
  facts: TxFact[];
  className?: string;
}) {
  return (
    <dl className={cn('divide-y divide-line rounded-md border border-line', className)}>
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="flex items-baseline justify-between gap-4 px-3 py-2"
        >
          <dt className="shrink-0 text-meta text-fg-muted">{fact.label}</dt>
          <dd
            className={cn(
              'min-w-0 truncate text-right',
              fact.mono && 'font-mono text-code',
              fact.emphasis ? 'text-section text-fg' : 'text-secondary text-fg',
            )}
            title={fact.value}
          >
            {fact.href ? (
              <a
                href={fact.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-accent-text hover:underline underline-offset-4"
              >
                {fact.value}
              </a>
            ) : (
              fact.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A material consequence the user should know before acting: a fee, a lock,
 * an asymmetry between parties.
 *
 * Deliberately styled as neutral information, not a warning — these are facts
 * about how the contract works, and alarming people about normal mechanics
 * erodes trust rather than building it.
 */
export function DisclosureNote({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  /** Use `caution` only when the fact genuinely disadvantages the user. */
  tone?: 'neutral' | 'caution';
  className?: string;
}) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 text-meta',
        tone === 'caution'
          ? 'border-warning-line bg-warning-subtle text-warning-text'
          : 'border-line bg-sunken text-fg-muted',
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
