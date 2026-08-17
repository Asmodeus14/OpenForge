'use client';

import { useState, type ReactNode } from 'react';
import { Check, ChevronDown, Copy, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  DEFAULT_CHAIN,
  explorerAddressUrl,
  explorerTxUrl,
  getChain,
  type TokenInfo,
} from '@/chain/config';
import { formatTokenAmount, shortenAddress, shortenHash } from '@/lib/format';
import type { Fact } from '@/types/trust';

/**
 * Trust components.
 *
 * Identity, money and network are presented one way across the whole
 * product. Pages must never hand-render an address or an amount — that is
 * how a "$1,200" ends up meaning something different on two screens.
 */

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className="text-fg-muted transition-colors duration-[var(--dur-fast)] hover:text-fg"
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard permission can be denied; the full value is on screen.
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

/**
 * An on-chain address: mono, truncated for display, copyable in full, and
 * linked to a block explorer so the user can always verify who they are
 * dealing with. Truncation is a display convenience — the full value stays
 * available to the clipboard, the tooltip and assistive tech.
 */
export function AddressDisplay({
  address,
  chainId = DEFAULT_CHAIN.chainId,
  name,
  chars = 4,
  showCopy = true,
  showExplorer = true,
  className,
}: {
  address: string;
  chainId?: number;
  name?: string;
  chars?: number;
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
}) {
  const href = explorerAddressUrl(chainId, address);

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {name && <span className="text-secondary text-fg">{name}</span>}
      <span
        className="font-mono text-code text-fg-secondary"
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
          aria-label="View address on the block explorer"
          className="text-fg-muted transition-colors duration-[var(--dur-fast)] hover:text-accent-text"
          onClick={(event) => event.stopPropagation()}
        >
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      )}
    </span>
  );
}

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
    <span className={cn('inline-flex flex-wrap items-center gap-2', className)}>
      <span className="font-mono text-code text-fg-secondary" title={hash}>
        {shortenHash(hash)}
      </span>
      <CopyButton value={hash} label="transaction hash" />
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-meta text-accent-text hover:underline underline-offset-4"
        >
          View transaction
          <ExternalLink className="size-3" aria-hidden />
        </a>
      )}
    </span>
  );
}

/**
 * A token amount.
 *
 * The symbol is never omitted, and decimals always come from the token
 * itself — tUSDC has 6, and rendering it as 18 misstates the value by a
 * factor of a trillion.
 */
export function TokenAmount({
  amount,
  token,
  size = 'inline',
  className,
}: {
  amount: bigint;
  token: Pick<TokenInfo, 'symbol' | 'decimals'>;
  size?: 'inline' | 'prominent';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'whitespace-nowrap tabular-nums text-fg',
        size === 'prominent' ? 'font-mono text-heading' : 'font-mono text-code',
        className,
      )}
    >
      {formatTokenAmount(amount, token.decimals)}
      <span className="ml-1 text-fg-muted">{token.symbol}</span>
    </span>
  );
}

/**
 * Persistent network indicator.
 *
 * OpenForge is deployed only to Sepolia, and its own documentation says not
 * to use real funds. Stating that quietly and permanently is more
 * trustworthy than leaving people to assume these are real balances.
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
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-micro font-medium',
        unsupported
          ? 'border-warning-line bg-warning-subtle text-warning-text'
          : 'border-line bg-subtle text-fg-secondary',
        className,
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', unsupported ? 'bg-warning' : 'bg-success')}
        aria-hidden
      />
      {unsupported ? 'Unsupported network' : (chain?.label ?? DEFAULT_CHAIN.label)}
    </span>
  );
}

/**
 * The WHAT / WHO / HOW MUCH / WHERE block.
 *
 * Shown before signing and repeated after completion, so the record of what
 * happened matches exactly what was agreed to.
 */
export type { Fact };

export function FactList({ facts, className }: { facts: Fact[]; className?: string }) {
  return (
    <dl className={cn('flex flex-col', className)}>
      {facts.map((fact, index) => (
        <div
          key={fact.label}
          className={cn(
            'flex items-baseline justify-between gap-6 py-3',
            index > 0 && 'border-t border-line-faint',
          )}
        >
          <dt className="shrink-0 text-secondary text-fg-muted">{fact.label}</dt>
          <dd
            className={cn(
              'min-w-0 text-right',
              fact.mono && 'font-mono text-code',
              fact.emphasis ? 'text-section text-fg' : 'text-secondary text-fg',
            )}
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A material consequence: a fee, a lock, an asymmetry between parties.
 *
 * Styled as information rather than a warning — these are facts about how
 * the contract works, and alarming people about normal mechanics costs trust
 * rather than building it. `caution` is reserved for facts that genuinely
 * disadvantage the reader.
 */
export function DisclosureNote({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'caution';
  className?: string;
}) {
  return (
    <p
      className={cn(
        'flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-meta',
        tone === 'caution'
          ? 'border-warning-line bg-warning-subtle text-warning-text'
          : 'border-line bg-subtle text-fg-secondary',
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/**
 * Progressive disclosure for blockchain internals.
 *
 * Simple by default, transparent on demand: ordinary users never have to
 * read a contract address, but the information is always one click away and
 * is never withheld.
 */
export function TechnicalDetails({
  children,
  summary = 'Blockchain details',
  className,
}: {
  children: ReactNode;
  summary?: string;
  className?: string;
}) {
  return (
    <details className={cn('group rounded-md border border-line bg-subtle', className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-meta text-fg-secondary transition-colors hover:text-fg">
        {summary}
        <ChevronDown
          className="size-3.5 shrink-0 transition-transform duration-[var(--dur-fast)] group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-line px-3.5 py-3">{children}</div>
    </details>
  );
}
