/**
 * Error translation.
 *
 * Users must never see `CALL_EXCEPTION`, `execution reverted`, a raw custom
 * error selector, or "Check console for details". They must see what
 * happened, whether their money moved, and what to do next (§25).
 *
 * The escrow contract reverts with BOTH custom errors and string `require`s,
 * so both forms are decoded here.
 */

export type ErrorKind =
  /** The user declined in their wallet. Nothing was sent. */
  | 'rejected'
  /** Failed before broadcast — bad input, insufficient gas balance, wrong state. */
  | 'not-sent'
  /** Broadcast and mined, but the contract reverted. Gas was spent. */
  | 'reverted'
  /** Could not reach the network or the node. Outcome unknown. */
  | 'network'
  /** Anything we cannot confidently classify. */
  | 'unknown';

export interface ParsedError {
  kind: ErrorKind;
  /** Short heading, e.g. "Milestone was not released". */
  title: string;
  /** Plain-language explanation. Complete sentences. */
  message: string;
  /** Whether retrying could plausibly succeed. */
  retryable: boolean;
  /** The original message, shown only behind a "Technical details" disclosure. */
  raw?: string;
}

/**
 * Contract revert reasons → human copy.
 *
 * Keys are matched case-insensitively as substrings, so both a custom error
 * name (`NotFunder`) and a `require` string ("Not authorized") resolve here.
 */
const REVERT_MESSAGES: [pattern: string, message: string][] = [
  // --- SimpleMilestoneEscrow: access control
  ['notfunder', 'Only the funder of this escrow can do that.'],
  ['notdeveloper', 'Only the developer on this escrow can do that.'],
  ['not authorized', 'Only the funder or the developer on this escrow can do that.'],

  // --- SimpleMilestoneEscrow: state machine
  [
    'invalidstate',
    'The escrow is no longer in a state that allows this action. Someone may have acted on it since this page loaded.',
  ],
  ['alreadyfunded', 'This escrow has already been funded.'],
  ['notfunded', 'This escrow has not been funded yet, so there is nothing to release.'],
  ['alreadyreleased', 'This milestone has already been released.'],
  ['invalidmilestone', 'That milestone does not exist on this escrow.'],
  [
    '30 days not passed',
    'The developer can only resolve a dispute 30 days after it was raised. That period has not elapsed yet.',
  ],
  [
    'deadlinenotpassed',
    'A milestone can only be cancelled after its deadline has passed.',
  ],

  // --- SimpleMilestoneEscrow: construction
  ['funder cannot be developer', 'The funder and the developer must be different addresses.'],
  ['zeroaddress', 'An address was empty. Check the funder, developer and token addresses.'],
  ['zeroamount', 'Every milestone must have an amount greater than zero.'],
  [
    'safeerc20failedoperation',
    'The token transfer was rejected by the token contract. Check your balance and that you approved enough.',
  ],

  // --- OpenForgeProjectRegistry
  ['only funder can register', 'Only the funder of an escrow can register it as a project.'],
  ['projectnotfound', 'That project does not exist in the registry.'],
  ['projectalreadyregistered', 'This escrow is already registered as a project.'],
  ['notprojectowner', 'Only the funder of this project can change it.'],

  // --- ProjectRegistry
  ['not project builder', 'Only the address that created this project can change it.'],
  [
    'can only update metadata in draft status',
    'Project details can only be edited while the project is a Draft. Once it moves to Funding they are permanent.',
  ],
  [
    'invalid status transition',
    'That status change is not allowed. A project goes Draft → Funding → Completed or Failed, and cannot move back.',
  ],

  // --- ProfileRegistry
  ['profile already exists', 'This wallet already has a profile. Edit it instead of creating a new one.'],
  ['profile does not exist', 'This wallet does not have a profile yet.'],
  ['profile not found', 'No profile has been created for this wallet.'],
  [
    'update cooldown active',
    'Profiles can only be edited once every 14 days. The cooldown from your last edit has not finished.',
  ],
];

function extractRawMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    const withFields = error as Error & { reason?: string; shortMessage?: string };
    return withFields.reason || withFields.shortMessage || error.message || '';
  }
  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    for (const key of ['reason', 'shortMessage', 'message', 'data']) {
      const value = obj[key];
      if (typeof value === 'string' && value) return value;
    }
  }
  return String(error);
}

function errorCode(error: unknown): string | number | undefined {
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj.code === 'string' || typeof obj.code === 'number') return obj.code;
    // MetaMask nests the EIP-1193 code under `info.error` in ethers v6.
    const info = obj.info as Record<string, unknown> | undefined;
    const nested = info?.error as Record<string, unknown> | undefined;
    if (nested && (typeof nested.code === 'string' || typeof nested.code === 'number')) {
      return nested.code as string | number;
    }
  }
  return undefined;
}

function matchRevertReason(raw: string): string | undefined {
  const haystack = raw.toLowerCase();
  for (const [pattern, message] of REVERT_MESSAGES) {
    if (haystack.includes(pattern)) return message;
  }
  return undefined;
}

/**
 * Translates any thrown value into copy safe to show a user.
 *
 * `context` names the attempted action and is used to build the heading —
 * pass something like "Milestone was not released" so the user learns the
 * outcome, not just that "an error occurred".
 */
export function parseError(error: unknown, context?: string): ParsedError {
  const raw = extractRawMessage(error);
  const code = errorCode(error);
  const lower = raw.toLowerCase();
  const title = context ?? 'Something went wrong';

  // --- A failure reported by the messaging backend.
  //
  //     Matched by name for the same reason as below, and handled just as
  //     early: nothing here touched the chain, so every piece of transaction
  //     copy further down is wrong. Signing in to messaging was being reported
  //     as "check the transaction on the block explorer" — advice to go
  //     looking for something that was never sent.
  //
  //     The message is passed through unchanged because `ChatApiError` already
  //     carries either the server's own wording or a specific description of
  //     why the request never left.
  if ((error as { name?: string })?.name === 'ChatApiError') {
    const status = (error as { status?: number }).status;
    return {
      kind: 'not-sent',
      title: context ?? 'The messaging server rejected that',
      message: raw,
      // 401 and 403 mean sign in again, not try again.
      retryable: status !== 401 && status !== 403,
      raw,
    };
  }

  // --- A token that will not identify itself.
  //
  //     Matched by name rather than by importing the class, so this module
  //     stays free of any dependency on `chain/`. Handled before everything
  //     below because no transaction is involved: the generic copy would
  //     invite the user to go looking for one on a block explorer.
  if ((error as { name?: string })?.name === 'UnreadableTokenError') {
    return {
      kind: 'not-sent',
      title: 'That token cannot be used',
      message:
        'This address did not return the number of decimals it uses, so amounts for it cannot be shown or sent accurately. It may not be an ERC20 token. Nothing was sent.',
      retryable: false,
      raw,
    };
  }

  // --- User declined in the wallet.
  if (
    code === 4001 ||
    code === 'ACTION_REJECTED' ||
    lower.includes('user rejected') ||
    lower.includes('user denied')
  ) {
    return {
      kind: 'rejected',
      title: 'Cancelled',
      message: 'You declined the request in your wallet. Nothing was sent and nothing changed.',
      retryable: true,
    };
  }

  // --- A known contract revert.
  const revertMessage = matchRevertReason(raw);
  if (revertMessage) {
    return {
      kind: 'reverted',
      title,
      message: revertMessage,
      retryable: false,
      raw,
    };
  }

  // --- Not enough native currency to pay for gas.
  if (
    code === 'INSUFFICIENT_FUNDS' ||
    lower.includes('insufficient funds') ||
    lower.includes('insufficient balance for gas')
  ) {
    return {
      kind: 'not-sent',
      title,
      message:
        'Your wallet does not have enough SepoliaETH to pay the network fee. The transaction was not sent. You can get test ETH from a Sepolia faucet.',
      retryable: true,
      raw,
    };
  }

  // --- Network / node problems. The outcome is genuinely unknown here, so
  //     the copy must not claim the transaction failed.
  if (
    code === 'NETWORK_ERROR' ||
    code === 'TIMEOUT' ||
    code === 'SERVER_ERROR' ||
    lower.includes('failed to fetch') ||
    lower.includes('could not coalesce') ||
    lower.includes('network error') ||
    lower.includes('timeout')
  ) {
    return {
      kind: 'network',
      title: 'Network did not respond',
      message:
        'We could not reach the network, so we cannot confirm what happened. Check the transaction on the block explorer before trying again.',
      retryable: true,
      raw,
    };
  }

  if (code === 'CALL_EXCEPTION' || lower.includes('execution reverted')) {
    return {
      kind: 'reverted',
      title,
      message:
        'The contract rejected this transaction. The on-chain state may have changed since this page loaded — refresh and check the current status before retrying.',
      retryable: false,
      raw,
    };
  }

  if (code === 'UNSUPPORTED_OPERATION' || lower.includes('unknown account')) {
    return {
      kind: 'not-sent',
      title,
      message: 'Your wallet is not connected or has no account selected. The transaction was not sent.',
      retryable: true,
      raw,
    };
  }

  return {
    kind: 'unknown',
    title,
    message:
      'The action did not complete. If this keeps happening, check the transaction on the block explorer before trying again.',
    retryable: true,
    raw,
  };
}

/**
 * Whether a failure of this kind could have moved funds.
 *
 * Drives the reassurance line in failure states — "Your funds have NOT been
 * released" is only safe to say when we know the transaction never landed.
 */
export function fundsCertainlyUnmoved(kind: ErrorKind): boolean {
  return kind === 'rejected' || kind === 'not-sent' || kind === 'reverted';
}
