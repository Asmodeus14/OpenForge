/**
 * Formatting primitives.
 *
 * Replaces seven separate address shorteners, three `formatDate`
 * implementations and two identical copies of `formatLargeNumber` that were
 * scattered across pages.
 *
 * Rule for anything financial: never round in a way that changes the number a
 * user is agreeing to. Compact notation ("1.2M") is for dashboards and counts,
 * never for an amount inside a confirmation dialog.
 */

import { formatUnits } from 'ethers';

/* ------------------------------------------------------------------ addresses */

/** `0x1234…abcd`. Returns the input unchanged if it isn't address-shaped. */
export function shortenAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return '';
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

/** `0x8f3a…91b2` for transaction hashes, which are longer than addresses. */
export function shortenHash(hash: string | null | undefined): string {
  if (!hash) return '';
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

/** `bafy…k3qm` for IPFS CIDs. */
export function shortenCid(cid: string | null | undefined): string {
  if (!cid) return '';
  if (cid.length <= 16) return cid;
  return `${cid.slice(0, 8)}…${cid.slice(-6)}`;
}

export function isAddressEqual(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

/* --------------------------------------------------------------------- money */

/**
 * Exact token amount, decimal-correct, with grouping.
 *
 * Always pass the token's real `decimals` — tUSDC is 6, not 18. Getting this
 * wrong misstates the amount by a factor of 10^12.
 *
 * Trailing zeros are trimmed ("1,200" not "1,200.000000") but significant
 * digits are never dropped.
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  options: { maxFractionDigits?: number } = {},
): string {
  const raw = formatUnits(amount, decimals);
  const [whole, fraction = ''] = raw.split('.');

  const max = options.maxFractionDigits ?? decimals;
  const trimmed = fraction.slice(0, max).replace(/0+$/, '');

  const groupedWhole = BigInt(whole).toLocaleString('en-US');
  return trimmed ? `${groupedWhole}.${trimmed}` : groupedWhole;
}

/** `1,200 tUSDC`. Symbol is never omitted — an amount without a unit is a trap. */
export function formatTokenAmountWithSymbol(
  amount: bigint,
  decimals: number,
  symbol: string,
  options?: { maxFractionDigits?: number },
): string {
  return `${formatTokenAmount(amount, decimals, options)} ${symbol}`;
}

/**
 * Compact notation for counts and dashboard statistics only.
 * Never use this for an amount the user is about to approve or release.
 */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

/** Percentage as a whole number, clamped to 0–100. */
export function formatPercent(numerator: number, denominator: number): string {
  if (!denominator) return '0%';
  const pct = Math.min(100, Math.max(0, (numerator / denominator) * 100));
  return `${Math.round(pct)}%`;
}

/* ---------------------------------------------------------------------- time */

/** Accepts seconds (chain) or milliseconds (JS) and normalises to a Date. */
export function toDate(value: number | bigint | string | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const n = typeof value === 'bigint' ? Number(value) : value;
  if (!Number.isFinite(n) || n <= 0) return null;

  // Chain timestamps are seconds; anything past this threshold is already ms.
  const ms = n < 1e12 ? n * 1000 : n;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `15 Aug 2026`. Returns `null` for missing dates so callers render an
 *  honest fallback rather than the string "Invalid Date". */
export function formatDate(value: Parameters<typeof toDate>[0]): string | null {
  const date = toDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** `15 Aug 2026, 14:32`. */
export function formatDateTime(value: Parameters<typeof toDate>[0]): string | null {
  const date = toDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
];

/** `3 days ago` / `in 2 months`. */
export function formatRelative(value: Parameters<typeof toDate>[0]): string | null {
  const date = toDate(value);
  if (!date) return null;

  const deltaSeconds = (date.getTime() - Date.now()) / 1000;
  const abs = Math.abs(deltaSeconds);
  if (abs < 45) return 'just now';

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (abs >= seconds) {
      return formatter.format(Math.round(deltaSeconds / seconds), unit);
    }
  }
  return 'just now';
}

/**
 * `13d 4h remaining` — for cooldowns and dispute timeouts, where the user
 * needs a duration rather than a date. Returns null once elapsed.
 */
export function formatCountdown(targetSeconds: bigint | number): string | null {
  const target = Number(targetSeconds) * 1000;
  const remaining = target - Date.now();
  if (remaining <= 0) return null;

  const totalMinutes = Math.floor(remaining / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** `14 days` — a duration expressed in plain language, for disclosure copy. */
export function formatDuration(seconds: bigint | number): string {
  const total = Number(seconds);
  const days = Math.floor(total / 86_400);
  if (days >= 1) return `${days} ${days === 1 ? 'day' : 'days'}`;
  const hours = Math.floor(total / 3_600);
  if (hours >= 1) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  const minutes = Math.max(1, Math.floor(total / 60));
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

/* --------------------------------------------------------------------- text */

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Wallet address fallback when no profile name is available. */
export function displayNameFor(
  address: string | null | undefined,
  profileName?: string | null,
): string {
  if (profileName && profileName.trim()) return profileName.trim();
  return shortenAddress(address);
}
