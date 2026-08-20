/**
 * IPFS reads. Safe on both the server and the client.
 *
 * Uploads deliberately live elsewhere (`lib/ipfs-upload.ts` + the
 * `/api/ipfs` route handler) so that pinning credentials never reach the
 * browser. The Vite app had no server, so it shipped `VITE_PINATA_API_KEY`
 * and `VITE_PINATA_API_SECRET` in the client bundle and sent them as headers
 * from every visitor's browser. Moving to Next is what makes that fixable.
 */

/**
 * Reads prefer a dedicated Pinata gateway. Content pinned to our account is
 * served from their CDN directly — no DHT lookup, no propagation wait, no
 * shared rate limit.
 *
 * It is preferred, not trusted. It was once reliably ~172ms warm; measured
 * again it answered in 1.5s and 2.0s and then hung past 20s on the third try.
 * So it gets a head start rather than an exclusive turn — see `raceGateways`.
 *
 * The gateway token is read-only and scoped to this gateway, so it is safe
 * to expose to the browser.
 */
const DEDICATED_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/\/+$/, '');
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_PINATA_GATEWAY_TOKEN;

/** Fallbacks, used only when the dedicated gateway is absent or fails. */
const PUBLIC_GATEWAYS = [
  'https://w3s.link/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
] as const;

const DEFAULT_TIMEOUT_MS = 8_000;
const DEDICATED_TIMEOUT_MS = 8_000;

/**
 * How long the dedicated gateway runs unchallenged before the public ones are
 * started alongside it.
 *
 * The previous design gave it a 4s exclusive window and only fell back after
 * that window expired, so a single hung request cost four seconds before any
 * alternative was even attempted — with roughly one CID in three hanging, and
 * ~25 CIDs read per page, that was the entire render budget. Hedging keeps the
 * common case (dedicated answers first) free of redundant public requests,
 * while capping the bad case at this delay plus whichever gateway responds.
 */
const HEDGE_DELAY_MS = 700;

export class IpfsError extends Error {
  cid: string;

  constructor(message: string, cid: string) {
    super(message);
    this.name = 'IpfsError';
    this.cid = cid;
  }
}

/** Accepts `ipfs://Qm…`, `https://gateway/ipfs/Qm…`, or a bare CID. */
export function normalizeCid(input: string): string {
  let cid = input.trim();
  if (cid.startsWith('ipfs://')) cid = cid.slice('ipfs://'.length);
  const marker = '/ipfs/';
  const index = cid.indexOf(marker);
  if (index !== -1) cid = cid.slice(index + marker.length);
  return cid.replace(/^\/+|\/+$/g, '');
}

function dedicatedUrl(cid: string): string | undefined {
  if (!DEDICATED_GATEWAY) return undefined;
  const base = DEDICATED_GATEWAY.startsWith('http')
    ? DEDICATED_GATEWAY
    : `https://${DEDICATED_GATEWAY}`;
  const url = `${base}/ipfs/${cid}`;
  return GATEWAY_TOKEN
    ? `${url}?pinataGatewayToken=${encodeURIComponent(GATEWAY_TOKEN)}`
    : url;
}

/** URL for rendering or linking content — images, avatars, downloads. */
export function ipfsUrl(cid: string): string {
  const normalized = normalizeCid(cid);
  return dedicatedUrl(normalized) ?? `${PUBLIC_GATEWAYS[0]}${normalized}`;
}

/** A tokenless public URL, for showing users where content actually lives. */
export function ipfsPublicUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${normalizeCid(cid)}`;
}

function withTimeout(signal: AbortSignal | undefined, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}

async function fetchJsonFrom<T>(
  url: string,
  signal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<T> {
  const { signal: timed, cleanup } = withTimeout(signal, timeoutMs);
  try {
    // A CID addresses immutable bytes, so an HTTP cache hit is always correct.
    const response = await fetch(url, { signal: timed, cache: 'force-cache' });
    if (!response.ok) throw new Error(`Gateway responded ${response.status}`);
    return (await response.json()) as T;
  } finally {
    cleanup();
  }
}

/** Resolves after `ms`, or rejects the moment the race is called off. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error('Aborted'));
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new Error('Aborted'));
      },
      { once: true },
    );
  });
}

/**
 * A CID is a hash of its own content, so the same CID can never resolve to
 * different bytes. Nothing here can go stale, which is why this cache has no
 * TTL — only a bound, so that a long-lived server process reading thousands of
 * projects cannot grow without limit.
 */
const CONTENT_CACHE_MAX = 500;
const contentCache = new Map<string, unknown>();

function cacheContent(cid: string, value: unknown): void {
  if (contentCache.size >= CONTENT_CACHE_MAX) {
    const oldest = contentCache.keys().next().value;
    if (oldest !== undefined) contentCache.delete(oldest);
  }
  contentCache.set(cid, value);
}

/**
 * Starts the dedicated gateway, then the public ones after a head start, and
 * takes whichever answers first.
 *
 * Every loser is aborted as soon as a winner emerges — including the pending
 * head-start timers, so a fast dedicated response means the public gateways
 * are never contacted at all.
 */
async function raceGateways<T>(
  cid: string,
  options: { signal?: AbortSignal; timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onAbort);

  const fast = dedicatedUrl(cid);
  const attempts: Promise<T>[] = [];

  if (fast) attempts.push(fetchJsonFrom<T>(fast, controller.signal, DEDICATED_TIMEOUT_MS));

  const headStart = fast ? HEDGE_DELAY_MS : 0;
  for (const gateway of PUBLIC_GATEWAYS) {
    attempts.push(
      sleep(headStart, controller.signal).then(() =>
        fetchJsonFrom<T>(
          `${gateway}${cid}`,
          controller.signal,
          options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        ),
      ),
    );
  }

  try {
    return await Promise.any(attempts);
  } catch {
    throw new IpfsError(
      'This content could not be loaded from any IPFS gateway. It may not be pinned, or the gateways may be unreachable.',
      cid,
    );
  } finally {
    controller.abort();
    options.signal?.removeEventListener('abort', onAbort);
  }
}

/** Fetches JSON by CID, from cache when possible and the fastest gateway otherwise. */
export async function fetchIpfsJson<T = unknown>(
  rawCid: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  const cid = normalizeCid(rawCid);
  if (!cid) throw new IpfsError('No content identifier was provided.', rawCid);

  if (contentCache.has(cid)) return contentCache.get(cid) as T;

  // Failures are deliberately not cached: an unreachable gateway is a
  // transient condition, unlike the content itself.
  const value = await raceGateways<T>(cid, options);
  cacheContent(cid, value);
  return value;
}
