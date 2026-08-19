import { NextResponse, type NextRequest } from 'next/server';

/**
 * Server-side IPFS pinning.
 *
 * The whole point of this route is that `PINATA_JWT` / `PINATA_API_KEY` /
 * `PINATA_API_SECRET` have no `NEXT_PUBLIC_` prefix, so they exist only on
 * the server. The browser posts content here; credentials never leave the
 * server. In the Vite app this was impossible — the keys were bundled into
 * the client and sent from every visitor's browser, meaning anyone with the
 * site could pin to the project's Pinata account.
 */

export const runtime = 'nodejs';

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

type Credential = { label: string; headers: Record<string, string> };

/**
 * Every configured credential, in preference order.
 *
 * Deliberately a list rather than a single choice: a JWT that has been revoked
 * still *looks* configured, and preferring it unconditionally makes a working
 * key/secret pair unreachable. Every pin then fails with a message that, by
 * design, cannot say which credential was at fault.
 */
function authCandidates(): Credential[] {
  const candidates: Credential[] = [];
  if (PINATA_JWT) {
    candidates.push({ label: 'JWT', headers: { Authorization: `Bearer ${PINATA_JWT}` } });
  }
  if (PINATA_API_KEY && PINATA_API_SECRET) {
    candidates.push({
      label: 'API key/secret',
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
    });
  }
  return candidates;
}

/**
 * Posts to Pinata, moving to the next credential if one is rejected.
 *
 * `buildRequest` is called per attempt so the body is constructed fresh rather
 * than reused across fetches. Only an authentication failure is retried — a
 * 413 or a Pinata outage means the next credential would fail identically.
 *
 * The status is logged server-side because the response to the browser
 * deliberately withholds it; without this, a revoked key is indistinguishable
 * from IPFS being down.
 */
async function pinataFetch(
  url: string,
  candidates: Credential[],
  buildRequest: (headers: Record<string, string>) => RequestInit,
): Promise<Response> {
  let lastResponse: Response | undefined;

  for (const candidate of candidates) {
    const response = await fetch(url, buildRequest(candidate.headers));
    if (response.ok) return response;

    console.error(
      `[api/ipfs] Pinata rejected the ${candidate.label} credential: ${response.status}`,
    );
    if (response.status !== 401 && response.status !== 403) return response;
    lastResponse = response;
  }

  return lastResponse!;
}

/** Never leak upstream provider detail or credentials into the response. */
function failure(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const candidates = authCandidates();
  if (candidates.length === 0) {
    return failure(
      'Uploads are unavailable: this deployment has no IPFS pinning credentials configured.',
      503,
    );
  }

  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('multipart/form-data')) {
      const incoming = await request.formData();
      const file = incoming.get('file');

      if (!(file instanceof File)) {
        return failure('No file was included in the request.', 400);
      }
      // Matches the limit enforced in the upload UI.
      if (file.size > 5 * 1024 * 1024) {
        return failure('Files must be 5 MB or smaller.', 413);
      }

      const response = await pinataFetch(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        candidates,
        (headers) => {
          const outgoing = new FormData();
          outgoing.append('file', file, file.name);
          return { method: 'POST', headers, body: outgoing };
        },
      );

      if (!response.ok) {
        return failure(
          'The file could not be stored on IPFS. Nothing was saved.',
          502,
        );
      }

      const data = (await response.json()) as { IpfsHash?: string };
      if (!data.IpfsHash) {
        return failure('IPFS returned no content identifier. Nothing was saved.', 502);
      }
      return NextResponse.json({ cid: data.IpfsHash });
    }

    const body = (await request.json()) as { content?: unknown; name?: string };
    if (body.content === undefined) {
      return failure('No content was included in the request.', 400);
    }

    const response = await pinataFetch(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      candidates,
      (headers) => ({
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(
          body.name
            ? { pinataMetadata: { name: body.name }, pinataContent: body.content }
            : body.content,
        ),
      }),
    );

    if (!response.ok) {
      return failure('The content could not be stored on IPFS. Nothing was saved.', 502);
    }

    const data = (await response.json()) as { IpfsHash?: string };
    if (!data.IpfsHash) {
      return failure('IPFS returned no content identifier. Nothing was saved.', 502);
    }
    return NextResponse.json({ cid: data.IpfsHash });
  } catch {
    return failure('The upload failed before it completed. Nothing was saved.', 500);
  }
}
