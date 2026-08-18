'use client';

import { isAddress } from 'ethers';
import { CircleCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/States';
import { AddressDisplay, DisclosureNote } from '@/components/trust/Trust';
import { DEFAULT_CHAIN, type TokenInfo } from '@/chain/config';
import { useTokenInfo } from '@/hooks/queries';
import { parseError } from '@/lib/errors';

/**
 * Which currency an escrow pays in.
 *
 * Any ERC20 works — the contract takes the token address as a constructor
 * argument and assumes nothing about it — so the UI should not pretend
 * otherwise. The listed tokens are a convenience for the common case; the
 * custom field is the general one.
 *
 * The safety here is not in restricting the list. It is in never guessing
 * `decimals`: an escrow denominated in a token whose decimals the UI got wrong
 * misstates every amount by orders of magnitude, and the funder would approve
 * a number meaning something entirely different to the contract. So a custom
 * address is resolved on chain before it can be used, and a token that will
 * not report its decimals is refused outright.
 *
 * This replaces a picker listing four mainnet tokens that do not exist on this
 * network, which labelled Chainlink LINK as "Sepolia USDC" with 6 decimals
 * when it is an 18-decimal utility token.
 *
 * Selection state lives in the parent. The selected token is *derived* from it
 * by `useTokenSelection` rather than copied into state by this component, so a
 * newly resolved token reaches the amount fields in the same render that
 * resolves it — not one render later, with the previous token's decimals still
 * validating the amounts.
 */

export const CUSTOM_TOKEN = 'custom';

/** The default selection: the project's own test token. */
export const DEFAULT_TOKEN_CHOICE = DEFAULT_CHAIN.tokens[0].address as string;

export interface TokenSelection {
  /** An address from the list, or `CUSTOM_TOKEN`. */
  choice: string;
  customAddress: string;
}

export function findListedToken(address: string): TokenInfo | null {
  return (
    DEFAULT_CHAIN.tokens.find(
      (listed) => listed.address.toLowerCase() === address.toLowerCase(),
    ) ?? null
  );
}

/**
 * Resolves a selection to a token, plus the query state the UI needs to
 * explain itself while an unlisted address is being read.
 */
export function useTokenSelection(selection: TokenSelection) {
  const isCustom = selection.choice === CUSTOM_TOKEN;
  const trimmed = selection.customAddress.trim();
  const addressLooksValid = isAddress(trimmed);

  // Queried only once the address is well-formed, so nothing is requested for
  // a half-typed address.
  const query = useTokenInfo(isCustom && addressLooksValid ? trimmed : null);

  return {
    isCustom,
    addressLooksValid,
    query,
    token: isCustom ? (query.data ?? null) : findListedToken(selection.choice),
  };
}

export function TokenSelect({
  selection,
  onSelectionChange,
  resolution,
  className,
}: {
  selection: TokenSelection;
  onSelectionChange: (selection: TokenSelection) => void;
  resolution: ReturnType<typeof useTokenSelection>;
  className?: string;
}) {
  const { isCustom, addressLooksValid, query, token } = resolution;
  const trimmed = selection.customAddress.trim();

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Select
        label="Currency"
        required
        value={selection.choice}
        onChange={(event) =>
          onSelectionChange({ ...selection, choice: event.target.value })
        }
        hint="The escrow pays in one ERC20 token, fixed at deployment."
      >
        {DEFAULT_CHAIN.tokens.map((listed) => (
          <option key={listed.address} value={listed.address}>
            {listed.symbol} — {listed.note ?? listed.name}
          </option>
        ))}
        <option value={CUSTOM_TOKEN}>Another token…</option>
      </Select>

      {isCustom && (
        <div className="flex flex-col gap-3">
          <Input
            label="Token contract address"
            required
            mono
            value={selection.customAddress}
            onChange={(event) =>
              onSelectionChange({ ...selection, customAddress: event.target.value })
            }
            placeholder="0x…"
            error={
              trimmed && !addressLooksValid
                ? 'That is not a valid contract address.'
                : query.isError
                  ? parseError(query.error).message
                  : undefined
            }
            hint="Read from the contract itself — nothing about it is assumed."
          />

          {query.isFetching && <Spinner label="Reading the token contract…" />}

          {query.data && (
            <div className="rounded-md border border-success-line bg-success-subtle px-3.5 py-2.5">
              <p className="flex flex-wrap items-center gap-2 text-secondary text-fg">
                <CircleCheck className="size-4 shrink-0 text-success-text" aria-hidden />
                <span className="font-medium">{query.data.symbol}</span>
                <span className="text-fg-secondary">{query.data.name}</span>
              </p>
              <p className="mt-1.5 text-meta text-fg-secondary">
                Reports {query.data.decimals}{' '}
                {query.data.decimals === 1 ? 'decimal' : 'decimals'}. Every amount below
                is interpreted at that precision.
              </p>
            </div>
          )}
        </div>
      )}

      {token && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-fg-muted">
          <span>Contract</span>
          <AddressDisplay address={token.address} chars={6} />
        </div>
      )}

      {/* Shown for unlisted tokens only. Each listed token was read from this
          chain and is an ordinary, non-rebasing implementation. */}
      {isCustom && query.data && (
        <DisclosureNote tone="caution">
          The escrow deposits the full total in one transfer and assumes all of it
          arrives. A token that takes a cut on transfer, or that changes balances over
          time, leaves the contract holding less than the milestones add up to — the
          final release then fails, and the funder has to cancel the project to recover
          whatever is actually there. Only use a token you know behaves plainly.
        </DisclosureNote>
      )}
    </div>
  );
}
