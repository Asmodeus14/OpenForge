/**
 * Verifies that `parseError` is idempotent.
 * Run with: npx tsx scripts/verify-errors.ts
 *
 * Hooks parse an error into state and then hand the result to `ErrorState`,
 * which parses whatever it is given. A second pass used to reclassify honest
 * copy as `unknown` and replace it with block-explorer advice, so this guards
 * a regression rather than testing the branches themselves.
 */
import { parseError } from '../lib/errors';

class ChatApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
  }
}

const cases: [string, unknown][] = [
  ['CORS / unreachable (status 0)', new ChatApiError(0, 'The messaging server is running, but it refused a request from http://localhost:3000.')],
  ['expired token (401)', new ChatApiError(401, 'Invalid or expired token')],
  ['rate limited (429)', new ChatApiError(429, 'Too many requests. Wait a few minutes and try again.')],
  ['user rejected signature', Object.assign(new Error('user rejected action'), { code: 'ACTION_REJECTED' })],
  ['contract revert', new Error('execution reverted: Not authorized')],
];

let bad = 0;
for (const [label, err] of cases) {
  const once = parseError(err, 'Not signed in to messaging');
  const twice = parseError(once, 'You were not signed in');

  const same = once.kind === twice.kind && once.message === twice.message;
  if (!same) bad++;
  console.log(`${same ? 'ok  ' : 'FAIL'}  ${label}`);
  console.log(`        1x  [${once.kind}] ${once.title} :: ${once.message.slice(0, 72)}`);
  console.log(`        2x  [${twice.kind}] ${twice.title} :: ${twice.message.slice(0, 72)}`);
}

console.log(bad === 0 ? '\nAll stable across a second parse.' : `\n${bad} changed on re-parse.`);
process.exit(bad === 0 ? 0 : 1);
