/**
 * Client-side upload helpers.
 *
 * These talk to `/api/ipfs`, which holds the pinning credentials. They never
 * see a secret.
 *
 * Every failure throws. There is deliberately no fallback path: the previous
 * implementation, when Pinata was unconfigured or errored, silently
 * fabricated a `bafybeimock…` CID, stored the content in localStorage, wrote
 * that fake CID to the blockchain, and told the user "updated successfully".
 * An upload that did not happen must fail loudly.
 */

async function post(body: BodyInit, headers?: HeadersInit): Promise<string> {
  const response = await fetch('/api/ipfs', { method: 'POST', body, headers });
  const data = (await response.json().catch(() => ({}))) as {
    cid?: string;
    error?: string;
  };

  if (!response.ok || !data.cid) {
    throw new Error(
      data.error ?? 'The upload failed and the content was not stored.',
    );
  }
  return data.cid;
}

/** Pins a JSON document and returns its CID. */
export function uploadJsonToIpfs(content: unknown, name?: string): Promise<string> {
  return post(JSON.stringify({ content, name }), {
    'Content-Type': 'application/json',
  });
}

/** Pins a file and returns its CID. */
export function uploadFileToIpfs(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  return post(form);
}
