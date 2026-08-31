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
| Contract deploy script | **none** | `scripts/deploy.js`, used for the live deployment |
| Contracts deployed | v1, Remix, optimizer off | v2 on Sepolia, reproducible build |
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

The frontend now realises that last row rather than only claiming it:
`createEscrow` replaces deploy-then-register, and `signPermit` +
`fundWithPermit` replace approve-then-deposit for any EIP-2612 token. The
signature step is shown to the user as a step, labelled as costing no gas,
rather than being folded invisibly into a transaction.

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

- **The v2 contracts are not verified on Etherscan.** `ETHERSCAN_API_KEY` is
  still the `.env.example` placeholder. A contract that asks people to lock
  funds in it should be readable by them; see
  `OpenForge-Contracts/deployments/sepolia.md` for the two commands.
- ~~**`import * as Icons from 'lucide-react'`** in `components/ui/Badge.tsx`~~
  **Fixed.** `components/ui/statusIcons.ts` now names each import behind a
  `Record<StatusIconName, …>`, so a name added to the union without an import
  is a compile error rather than a missing icon.
- **Client-side profile N+1 on the two public pages.** `Person` resolves each
  address through one RPC read plus one IPFS fetch. `/discover` renders up to
  24 and `/funding` up to 100 — both pages otherwise fully server-rendered.
  The server loaders already resolve IPFS metadata in a `Promise.all`; profiles
  should join it.
- ~~**`/funding` has no `loading.tsx`**~~ **Fixed.** `app/(app)/funding/loading.tsx`
  exists and mirrors the real layout.
- **Backend: nonces are `Math.random()`, never expire, and any stranger can
  reset yours** by calling the unauthenticated `/auth/nonce` for your address.
  The signed message is bound to no domain, chain or time — it is not SIWE.
- **Backend: no blockchain indexer of any kind.** The server has no knowledge
  of on-chain state, so a room's link to an escrow is an unvalidated
  client-supplied string. Room membership is social, not contract-derived.

### P2 — outstanding

- `/profile` is not in the navigation, and `/profile/[address]` — a full
  server-rendered public page — is linked from only two places.
- ~~Safe-area inset double-counted at the bottom of every page on notched
  phones.~~ **Fixed.** `<main>` now reserves
  `calc(3.5rem + env(safe-area-inset-bottom))`. `/messages` sizes itself to the
  viewport, so its height calc subtracts the same inset to stay in agreement.
- ~~`components/ui/Table.tsx` never actually scrolls.~~ **Fixed.** `min-w-full`
  is replaced by a real `minWidth` prop (default `28rem`), so the wrapper has
  something to scroll. The docstring also advertised a `mobileCards` prop that
  was never implemented; that claim is gone.
- ~~`'Platform fee (1.5%)'` is hardcoded in `components/escrow/intents.tsx`.~~
  **Fixed.** `intents.tsx` computes it from `feeBps`. The remaining hardcodes
  were on `/funding`, which now uses the shared `feePercent` helper in
  `lib/format.ts`. (`EscrowIllustration`, which kept its literal deliberately,
  was deleted with the old landing page.)
- ~~Four unused runtime dependencies in the frontend (`sonner`, three Radix
  packages).~~ **Fixed.** The three Radix packages (`react-popover`,
  `react-select`, `react-tooltip`) are removed. `sonner` is now mounted as the
  product's transient feedback layer — see `components/ui/Toaster.tsx`.
  Three remain in the backend (`bcryptjs`, `uuid`, `pg-pool`).
- Backend: five near-identical membership checks, no two identical; four
  distinct API response envelopes across 29 endpoints; `parseInt` on
  unvalidated `limit`/`offset` turns `?limit=abc` into a 500.
- No pagination on six backend endpoints that return unbounded sets.

---

## UI pass — found and fixed

Not previously recorded. Ordered by consequence.

- **`/design` demonstrated a patched vulnerability as current behaviour.** Its
  example `caution` note read "The funder can resolve a dispute immediately.
  You must wait 30 days" — not a stale figure but a description of the v1
  asymmetry listed under P0 above, the one that let the funder win every
  dispute by construction. `PROTOCOL.disputeWindowSeconds` has been 14 days and
  symmetric since the v2 deploy. A reference page is exactly where a sentence
  gets copied into something real, so it now derives the window and states what
  a dispute actually does: freezes reclaim, awards nothing, once per party.
- **The escrow wizard claimed four wallet confirmations.** The summary beside
  the deposit total described the pre-factory flow — deploy, register, approve,
  deposit — long after `createEscrow` folded the first two and EIP-2612 folded
  the last two. `hooks/queries.ts` already said "two wallet confirmations or
  three" in a comment; the wizard was the last place saying four. It now derives
  the count from the same two facts `createEscrowIntent` branches on, and says
  nothing at all while the permit read is in flight rather than guessing.
- **`--fg-muted` failed WCAG AA in both themes** — 3.62:1 light, 4.12:1 dark,
  and never used above 13px. It carries field hints, `Stat` labels, table
  headers, timestamps and the net-of-fee figure under every milestone. Now
  `#6e6e73` (5.07:1) and `#8b8b94` (5.91:1).
- **`prefers-reduced-motion` froze every spinner.** The blanket
  `animation-duration: 0.01ms !important` does not shorten `animate-spin`, it
  stops it on frame one — turning the only sign that a transaction was still in
  flight into a static icon, for the users least able to infer progress from a
  frozen screen. The whole block was reworked rather than patched: the setting
  asks for less movement, not a still image, so durations are no longer zeroed
  and nothing is globally silenced. The four overlay keyframes are redefined
  under the query to cross-fade in place, which removes the travel at source
  and leaves the fades, hover tints and focus rings that carry no vestibular
  risk and do real work. See `docs/DESIGN.md` for the placement constraint —
  the override must sit after the originals and outside `@layer base` or it
  silently loses.
- **Overlays animated in but not out.** Radix unmounts immediately unless it
  finds an animation on `[data-state="closed"]`, so a 220ms entrance was paired
  with a dropped frame. Exits now run at `--dur-fast`.
- **The command palette animated on ⌘K.** Removed entirely; only the backdrop
  fades. A surface opened dozens of times a day should not make the user wait
  for it, and the field being typed into should not still be moving.
- **The hero headline had two orphans.** A hard `<br />` left over from a
  fixed-size headline fought the fluid `clamp`, producing four lines with
  "work" and "time." alone. Fixed with `text-balance`. The redesign later
  reintroduced a break deliberately — the new headline is two authored beats —
  and the two now coexist: the `<br />` sets the split, `text-balance` evens
  what falls either side of it.
- **`FundingProgress` read as a divider** — 6px tall across a 1000px column, in
  a list whose rows are separated by hairlines. Constrained and thickened; its
  `aria-label` also stopped at two of the three segments it renders.
- **`Composer` and `MessageList` had each restated `Input`'s field style from
  memory**, and both had drifted — neither carried the shadow, the transition
  or the hover border. Extracted to `components/ui/fieldStyles.ts`, following
  the same non-client-module pattern as `buttonStyles.ts`.
- **`scroll-behavior: smooth` was global** and affected exactly one thing: the
  skip link. Next forces `auto` for router navigation, and the property is not
  inherited so the chat transcript was never affected. Removed.

Two things looked like defects from the source and were not:

- **Hover states are already gated for touch.** Tailwind v4 emits every
  `hover:` and `group-hover:` utility inside `@media (hover: hover)`. Verified
  in the compiled CSS. No change needed.
- **The missing `loading.tsx` files are deliberate.** `/projects/[projectId]`
  and `/profile/[address]` document why: streaming flushes a 200 before
  `notFound()` runs, so a shareable URL returns a soft 404. `/escrow/[address]`
  calls `notFound()` too. Every client component already renders its own
  skeleton. Do not add them.

---

## Things that were already right

Worth recording so they do not get "improved":

- **Every SQL query in the backend is parameterised.** Forty-plus queries,
  including two dynamic `WHERE` builders that interpolate only a counter. No
  concatenated user input anywhere.
- **Message ownership is enforced in SQL**, not in JavaScript, so there is no
  check to forget.
- **Every frontend server loader is parallel.** No loader in `lib/server/`
  awaits inside a loop; they fan out with `Promise.all`. (This was once stated
  as "not a single `await` inside a `for` loop in the codebase", which is no
  longer true and was the wrong claim anyway: `app/api/ipfs/route.ts` walks its
  Pinata credentials sequentially on purpose, because the point is to stop at
  the first one that works.)
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
