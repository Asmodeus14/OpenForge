# Decisions and limitations

A record of what was changed, what was deliberately left out, and what is
still wrong. Written so the next person does not have to re-derive it — or
re-add something that was removed on purpose.

---

## Why this is a Next.js app

The deciding factor was not rendering. It was that **Vite has no server**, so
`VITE_PINATA_API_KEY`, `VITE_PINATA_API_SECRET` and `VITE_PINATA_JWT` were
compiled into the JavaScript served to every visitor. Anyone loading the site
could extract them and pin or unpin content using the project's account.

`app/api/ipfs/route.ts` fixes that: the credentials have no `NEXT_PUBLIC_`
prefix, live only on the server, and the browser posts to a route rather than
to Pinata.

Server rendering of Discover, project detail and public profiles came free
with the move, and matters for pages people share links to.

---

## Ship only what is real

Issues, Roadmap, Reputation, Contributions, Contributors, Discussions,
Notifications, a transactions ledger and Saved items all appeared in the old
navigation. An audit of the contracts *and* the backend found **zero** backing
for any of them — not stubbed, absent.

They are not in the navigation. A permanently empty page behind a nav item is
a promise the product cannot keep. Each becomes one line in
`lib/navigation.ts` the moment something real backs it.

The same reasoning removed two chat surfaces: file attachments
(`POST /api/messages/upload`) and link previews (`GET /api/metadata`) both
return **404** on the deployed backend. A paperclip that always fails is worse
than no paperclip.

**Contributor discovery is deferred, not faked.** `ProfileRegistry` has no
enumeration function, so a directory would require indexing `ProfileCreated`
logs. That is real work, and it is honest to say it has not been done.

---

## Dependencies removed

The old app shipped `three`, `@react-three/fiber`, `@react-three/drei`,
`@react-spring/three`, `postprocessing`, `gsap`, `framer-motion`, `animejs`,
`react-spinners`, `react-loading-indicators`, `react-icons`, MUI with both
Emotion packages, `@mui/x-date-pickers`, `dayjs`, `ipfs-http-client`,
`pinata-web3`, and a 21.4 MB `public/Owl.glb`.

It also shipped `wagmi`, `viem`, `zustand` and `valtio` — **all four entirely
unused.** There was no `WagmiProvider` anywhere. `@tanstack/react-query` was
likewise a dependency with no `QueryClientProvider`.

Decision: **keep ethers, adopt react-query, drop wagmi and viem.** Rewriting
working escrow logic onto wagmi buys nothing and risks money paths;
react-query buys uniform loading, error, retry and caching behaviour and was
already installed.

Motion is CSS transitions only. Lucide is the single icon system.

Result: roughly 29,800 lines across the old `src/` became about 14,200,
including all documentation and the design-system reference page.

---

## Bugs fixed on the way

**Money and trust**

- `GasFeeWarning`'s **Cancel** button deployed the contract. Cancel and "I
  Understand, Proceed" both called `onClose`, and the caller wired `onClose`
  to `handleDeployContract()`. Pressing Cancel spent gas. Structurally
  impossible now: `TransactionFlow` has separate `cancel` and `confirm`
  handlers.
- Contracts never loaded on first mount — `init()` called
  `fetchUserContracts()` immediately after `setSigner()`, but the function
  guarded on the `signer` *state*, still `null` in that closure. Replaced by
  react-query.
- `uploadToMockIPFS` fabricated CIDs and wrote them on chain while reporting
  success. Removed with no fallback.
- The token list offered mainnet assets that do not exist on Sepolia, and
  labelled Chainlink LINK as "Sepolia USDC".
- `buildProfileMetadata` destroyed `createdAt` on every profile update.
- A mainnet `alchemy.com/v2/demo` fallback provider in a Sepolia-only app.

**Correctness**

- `window.prompt()` collected the dispute reason — a permanent on-chain string
  gathered in an unstyled browser box.
- The chat socket listed the selected room in its effect dependencies and
  reconnected on every room switch.
- `pendingRequests.filter(r => r.id === room.id)` compared a request id to a
  room id, always yielding zero.
- A global-flag `URL_REGEX` used with `.test()`, whose `lastIndex` made
  detection alternate between calls.
- An IPFS helper routed real CIDv1s beginning `bafybeig` to localStorage,
  because the mock prefix check was a prefix of a legitimate one.
- `useProfile`'s cache was declared inside the hook body and so never
  persisted across renders.
- `removeListener(…, () => {})` — a no-op cleanup that leaked a handler on
  every mount.
- `networkError` was set in four places and rendered in none.
- Duplicate `variants` props silently disabled a stagger animation.
- Two modals rendered an empty black box containing only
  `{/* Modal content remains the same */}`.

**Discovered during this rebuild**

- `loading.tsx` on a dynamic route makes `notFound()` return **200**. Measured,
  and both affected routes now carry a comment explaining why they have none.
- `NEXT_PUBLIC_API_URL` is conventionally written with `/api` already on it,
  which would have produced `/api/api/auth/nonce`. `lib/chat/api.ts`
  normalises either form.
- `.gitignore`'s `.env*` also ignored `.env.example`, so the template could
  never be committed. Now excepted.
- `TagInput` had a hardcoded DOM `id`; two on one page would have collided.

---

## Known limitations

These are real and unfixed. They are recorded rather than hidden.

- **Write paths are unverified end to end.** Deploy, approve, fund, release,
  cancel and dispute have been ported call-for-call and typechecked, but
  exercising them needs a funded Sepolia wallet. Read paths are verified.
- **The two project registries are disjoint.** `ProjectRegistry` (ids from 0)
  and `OpenForgeProjectRegistry` (ids from 1) share no state. The UI does not
  pretend otherwise, but a user may reasonably expect one project list.
- **The contracts are unaudited** and were compiled with the optimiser
  disabled. They have no tests.
- **The fee recipient is an EOA**, not a treasury contract, hardcoded in
  bytecode.
- **Backend P2P direct messages are broken.**
  `create_or_get_p2p_room` is missing and there is a `$2` parameter bug. The
  UI does not offer DMs.
- **The backend serves a shadowed messages route.** `/api/rooms` is registered
  before `/api`, so `routes/messages.js`'s handler is unreachable and the one
  in `routes/rooms.js` wins. The reachable one returns no `like_count` or
  `liked_by`, which is why likes are not shown on historic messages.
- **Chat is not end-to-end encrypted.** Anyone running the server can read
  every message. The room-creation dialog says so.
- **The chat backend sleeps.** It is on a free tier; a cold start can take
  close to a minute, and `lib/chat/api.ts` says that rather than reporting
  "failed to fetch".
- **The Pinata gateway token is public by necessity.** It is read-only and
  gateway-scoped, but it is in the client bundle.
- **No test suite.** Verification so far is `tsc`, ESLint, a passing build and
  manual route probing.

---

## Conventions worth keeping

- Comments explain **why**, never what. If a line needs explaining, that
  explanation is the reason it exists, not a restatement of its syntax.
- Anything surprising gets a comment saying why it is that way, especially
  where the correct code looks like a mistake — the missing `loading.tsx`
  files, `buttonStyles.ts` having no `'use client'`, the per-milestone fee sum.
- `lib/status.ts` uses const objects rather than TypeScript enums, because the
  build runs with `erasableSyntaxOnly`.
- BigInt literals require the ES2022 target in `tsconfig`.
- localStorage is external state, so it is read with `useSyncExternalStore`
  (theme, chat token) rather than a `useEffect` that calls `setState`.
