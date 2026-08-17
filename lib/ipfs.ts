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
 * Reads go through a dedicated Pinata gateway.
 *
 * This matters enormously for perceived speed. Measured against a real CID
 * from the project registry: the dedicated gateway answered in 2.4s cold and
 * 172ms warm, while ipfs.io, w3s.link and dweb.link all timed out at 15s.
 * Content pinned to our Pinata account is served from their CDN directly —
 * no DHT lookup, no propagation wait, no shared rate limit.
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
const DEDICATED_TIMEOUT_MS = 4_000;

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
    const response = await fetch(url, { signal: timed });
    if (!response.ok) throw new Error(`Gateway responded ${response.status}`);
    return (await response.json()) as T;
  } finally {
    cleanup();
  }
}

/**
 * Fetches JSON by CID.
 *
 * Tries the dedicated gateway alone first — when configured it almost always
 * wins, and going straight to it avoids firing four redundant public requests
 * per CID. Only on failure does it race the public gateways, which are
 * individually unreliable enough that racing is the only way to make them
 * feel responsive.
 */
export async function fetchIpfsJson<T = unknown>(
  rawCid: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  const cid = normalizeCid(rawCid);
  if (!cid) throw new IpfsError('No content identifier was provided.', rawCid);

  const fast = dedicatedUrl(cid);
  if (fast) {
    try {
      return await fetchJsonFrom<T>(fast, options.signal, DEDICATED_TIMEOUT_MS);
    } catch {
      // Fall through to the public gateways.
    }
  }

  try {
    return await Promise.any(
      PUBLIC_GATEWAYS.map((gateway) =>
        fetchJsonFrom<T>(
          `${gateway}${cid}`,
          options.signal,
          options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        ),
      ),
    );
  } catch {
    throw new IpfsError(
      'This content could not be loaded from any IPFS gateway. It may not be pinned, or the gateways may be unreachable.',
      cid,
    );
  }
}
