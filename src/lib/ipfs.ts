/**
 * IPFS access — reading through public gateways, writing through Pinata.
 *
 * Replaces seven ad-hoc gateway fetchers, each with its own hardcoded
 * `IPFS_GATEWAY` constant and its own timeout behaviour.
 *
 * Deliberately removed: the `mock-` / `bafybeimock` / `bafybeig` localStorage
 * backdoor. It silently fabricated CIDs, wrote them to the blockchain, and
 * reported success — while `bafybeig` is a legitimate CIDv1 prefix, so real
 * content was being misrouted to localStorage and failing to resolve. An
 * upload that cannot happen must fail loudly, not invent a receipt.
 */

/**
 * Reads go through a dedicated Pinata gateway when one is configured.
 *
 * This matters a lot for perceived speed. Our content is already pinned to
 * Pinata, so a dedicated gateway serves it straight from their CDN — no DHT
 * lookup, no propagation wait, no shared rate limit. Public gateways commonly
 * take 3–10s on a cold CID; the dedicated one is typically under 200ms.
 *
 * The gateway token is read-only and scoped to this gateway, so it is safe in
 * the browser (the Next rewrite exposes it as NEXT_PUBLIC_ for the same reason).
 */
const DEDICATED_GATEWAY = (import.meta.env.VITE_PINATA_GATEWAY as string | undefined)
  ?.replace(/\/+$/, '');
const GATEWAY_TOKEN = import.meta.env.VITE_PINATA_GATEWAY_TOKEN as string | undefined;

/** Public fallbacks, used only if the dedicated gateway is absent or fails. */
const PUBLIC_GATEWAYS = [
  'https://w3s.link/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
] as const;

const DEFAULT_TIMEOUT_MS = 8_000;
/** The dedicated gateway should answer fast; fail over quickly if it doesn't. */
const DEDICATED_TIMEOUT_MS = 4_000;

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
  const idx = cid.indexOf(marker);
  if (idx !== -1) cid = cid.slice(idx + marker.length);
  return cid.replace(/^\/+|\/+$/g, '');
}

/**
 * A URL for displaying or linking to content — images, avatars, downloads.
 *
 * Prefers the dedicated gateway so `<img>` loads are fast too. The previous
 * code pointed every image at `ipfs.io`, which is the main reason avatars and
 * project covers took seconds to appear.
 */
export function ipfsUrl(cid: string): string {
  const normalized = normalizeCid(cid);
  return dedicatedUrl(normalized) ?? `${PUBLIC_GATEWAYS[0]}${normalized}`;
}

/** A public URL with no token, for showing users where content lives. */
export function ipfsPublicUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${normalizeCid(cid)}`;
}

function withTimeout(signal: AbortSignal | undefined, ms: number): {
  signal: AbortSignal;
  cleanup: () => void;
} {
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
 * Fetches JSON from IPFS.
 *
 * Two-tier strategy: try the dedicated gateway alone first — when configured
 * it almost always wins, and going straight to it avoids firing four
 * redundant public requests per CID. Only if it is missing or fails do we
 * race the public gateways, which are individually unreliable enough that
 * racing is the only way to make them feel responsive.
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
      // Fall through to the public gateways below.
    }
  }

  const attempts = PUBLIC_GATEWAYS.map((gateway) =>
    fetchJsonFrom<T>(
      `${gateway}${cid}`,
      options.signal,
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    ),
  );

  try {
    return await Promise.any(attempts);
  } catch {
    throw new IpfsError(
      'This content could not be loaded from any IPFS gateway. It may not be pinned, or the gateways may be unreachable.',
      cid,
    );
  }
}

/* -------------------------------------------------------------- uploading */

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string | undefined;
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY as string | undefined;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET as string | undefined;

export function isPinningConfigured(): boolean {
  return Boolean(PINATA_JWT || (PINATA_API_KEY && PINATA_API_SECRET));
}

function pinataAuthHeaders(): Record<string, string> {
  if (PINATA_JWT) return { Authorization: `Bearer ${PINATA_JWT}` };
  if (PINATA_API_KEY && PINATA_API_SECRET) {
    return {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    };
  }
  throw new Error(
    'Uploads are not available: no IPFS pinning credentials are configured.',
  );
}

async function pinataRequest(path: string, init: RequestInit): Promise<string> {
  const response = await fetch(`https://api.pinata.cloud/pinning/${path}`, {
    ...init,
    headers: { ...pinataAuthHeaders(), ...(init.headers ?? {}) },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `IPFS upload failed (${response.status}). The content was not stored.${
        body ? ` ${body.slice(0, 200)}` : ''
      }`,
    );
  }

  const data = (await response.json()) as { IpfsHash?: string };
  if (!data.IpfsHash) {
    throw new Error('IPFS upload returned no content identifier. The content was not stored.');
  }
  return data.IpfsHash;
}

/** Pins a JSON document and returns its CID. Throws on any failure. */
export function uploadJsonToIpfs(content: unknown, name?: string): Promise<string> {
  return pinataRequest('pinJSONToIPFS', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      name ? { pinataMetadata: { name }, pinataContent: content } : content,
    ),
  });
}

/** Pins a file and returns its CID. Throws on any failure. */
export function uploadFileToIpfs(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  return pinataRequest('pinFileToIPFS', { method: 'POST', body: form });
}

/** Best-effort cleanup of a superseded CID. Never throws — unpinning is not
 *  essential, and a failure here must not look like the update failed. */
export async function unpinFromIpfs(cid: string): Promise<void> {
  try {
    await fetch(`https://api.pinata.cloud/pinning/unpin/${normalizeCid(cid)}`, {
      method: 'DELETE',
      headers: pinataAuthHeaders(),
    });
  } catch {
    // Intentionally ignored.
  }
}
