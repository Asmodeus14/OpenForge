# Audit baseline

Measured state of all three repositories at the start of the production
overhaul, and what has changed since. Every number here was produced by running
something. Where a figure was never measured, it says so rather than guessing.

---

## Repositories

| | Path | Remote |
|---|---|---|
| Frontend | `OpenForge-Frontend` | `Asmodeus14/OpenForge` |
| Backend | `OpenForge-Backend` | `Asmodeus14/OpenForge-Backend` |
| Contracts | `OpenForge-Contracts` | local only |
| Docs | `OpenForge` | `Asmodeus14/OpenForge-Documentation` |

`OpenForge` is the documentation repository, not the frontend — the frontend's
remote is named `OpenForge` but its directory is `OpenForge-Frontend`.

## Baseline

| | Before | After |
|---|---|---|
| Frontend `tsc` / ESLint / `next build` | clean | clean |
| Frontend tests | none | none (see Remaining) |
| Backend tests | none | 14 security checks, run against the live server |
| Contract build tooling | **none** — Remix only | Hardhat, solc pinned 0.8.24 |
| Contract tests | **zero** | 29 passing |
| Contract optimizer | **disabled** | enabled, `runs: 200` |
| Contract deploy script | **none** | `scripts/deploy.js`, dry-run verified |
| OpenZeppelin | 3 versions vendored in one build | pinned 5.0.2 + lockfile |

The contracts had no `package.json`, no test framework, no deployment script
and no CI. Deployment was manual through the Remix desktop IDE — which is why
two different `TestUSDC` contracts ended up pinned, and why the ABI the
frontend embeds had to be byte-compared against a Remix artifact by hand.

## Gas, measured

| | v1 | v2 |
|---|---|---|
| Deploy escrow | 2,855,175 (Sepolia `estimateGas`) | — |
| Deploy **and** register | 2,855,175 + a second transaction | **1,814,955** |
| Approve | 47,276 (Sepolia) | folded into `fundWithPermit` |
| Transactions to start a funded project | **4** | **2** |

Full table and the storage-layout reasoning: `OpenForge-Contracts/docs/GAS_OPTIMIZATION.md`.

---

## What was wrong, by severity

### P0 — fixed

**Contracts** (`OpenForge-Contracts/docs/SECURITY.md` for detail)

- The funder could withdraw every unreleased token at any moment with no
  notice and no developer consent. The escrow did not escrow.
- Dispute resolution was asymmetric by 30 days, so the funder won every
  dispute by construction.
- A developer who delivered nothing could raise a free dispute and sweep the
  entire balance from an inattentive funder.
- The registry accepted any address as an escrow, so the product's project
  list was spoofable by anyone.

**Backend**

- `JWT_SECRET` was an eleven-character dictionary word with digits. A token
  carries only `{ walletAddress }` and the middleware trusts it, so cracking
  that offline from one captured token forged a token for any wallet,
  including any room admin. The value is deliberately not written down here:
  it is still live until it is rotated in the Render dashboard.
- Every JWT was written to the log stream in full on each socket connection.
- A pending member could read a room's entire history — and anyone could
  create their own pending membership on any public room with no admin action.
- An admin who left a room kept every admin power over it, including deleting
  it.
- `connectionStateRecovery` with `skipMiddlewares: true` crashed the process on
  every recovered reconnect.
- The migration runner re-ran every file on every invocation, so it failed on
  any existing database and silently never applied anything after the first
  file.

### P1 — outstanding

- **The frontend still points at the v1 contracts.** Nothing is deployed yet.
- **`import * as Icons from 'lucide-react'`** in `components/ui/Badge.tsx`
  defeats tree-shaking on a 39 MB dependency, in the shared shell chunk for
  every application route. `lib/status.ts` stores icon names as strings;
  `lib/navigation.ts` already models the fix by storing the component.
- **Client-side profile N+1 on the two public pages.** `Person` resolves each
  address through one RPC read plus one IPFS fetch. `/discover` renders up to
  24 and `/funding` up to 100 — both pages otherwise fully server-rendered.
  The server loaders already resolve IPFS metadata in a `Promise.all`; profiles
  should join it.
- **`/funding` has no `loading.tsx`** despite ~600 server-side RPC reads.
- **Backend: nonces are `Math.random()`, never expire, and any stranger can
  reset yours** by calling the unauthenticated `/auth/nonce` for your address.
  The signed message is bound to no domain, chain or time — it is not SIWE.
- **Backend: no blockchain indexer of any kind.** The server has no knowledge
  of on-chain state, so a room's link to an escrow is an unvalidated
  client-supplied string. Room membership is social, not contract-derived.

### P2 — outstanding

- `/profile` is not in the navigation, and `/profile/[address]` — a full
  server-rendered public page — is linked from only two places.
- Safe-area inset double-counted at the bottom of every page on notched
  phones (`app/(app)/layout.tsx` reserves `pb-14`; the tab bar is taller).
- `components/ui/Table.tsx` never actually scrolls: `min-w-full` beside
  `w-full` is a no-op, so columns crush instead.
- `'Platform fee (1.5%)'` is hardcoded in `components/escrow/intents.tsx` — in
  the signing dialog, beside a fee that *is* computed from the constant.
- Four unused runtime dependencies in the frontend (`sonner`, three Radix
  packages); three in the backend (`bcryptjs`, `uuid`, `pg-pool`).
- Backend: five near-identical membership checks, no two identical; four
  distinct API response envelopes across 29 endpoints; `parseInt` on
  unvalidated `limit`/`offset` turns `?limit=abc` into a 500.
- No pagination on six backend endpoints that return unbounded sets.

---

## Things that were already right

Worth recording so they do not get "improved":

- **Every SQL query in the backend is parameterised.** Forty-plus queries,
  including two dynamic `WHERE` builders that interpolate only a counter. No
  concatenated user input anywhere.
- **Message ownership is enforced in SQL**, not in JavaScript, so there is no
  check to forget.
- **Every frontend server loader is parallel.** There is not a single `await`
  inside a `for` loop in the codebase.
- **The accessibility layer**: `IconButton` requires a label, fields are wired
  with `useId`, status is never colour alone, and there is a global
  `:focus-visible`.
- **The landing page invents nothing.** No fabricated statistics, testimonials
  or social proof, and it names the product's own weaknesses.
- **`lib/navigation.ts` refuses to ship nav items for features that do not
  exist.**

---

## Known environment issues

- **The backend's `.env` points at the production Neon database**, and the
  local dev server uses it. Test runs during this work created users and rooms
  in production; they are inert but real. A separate development database is
  the fix.
- **`NODE_ENV=production` is set locally**, so the local server takes
  production code paths.
- **`src/routes/auth.js` has an uncommitted one-line fix** (`require('../config/db')`).
  Until it is committed and deployed, `GET /api/auth/me` returns 500 on Render.
- **Migrations 002 and 003 were applied by hand** to the production database
  before the runner could do it. The runner now adopts them rather than
  re-running them.
