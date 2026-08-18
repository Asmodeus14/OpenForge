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

**Chat, found by testing against a running backend rather than by reading**

Both of these were shipped and silently broken; `/messages` could not create
or list a single room. Neither is visible from the frontend source alone —
the request succeeds in the sense that it returns, and the shapes look
plausible.

- **`createRoom` sent `isPrivate`; the server requires `roomType`** and
  rejects the request without it. Every room creation returned
  `400 Name and room type required`. Verified: the old shape 400s, the new
  one returns 201.
- **`listMyRooms` read `data.rooms`; the server returns
  `{ approvedRooms, pendingRooms }`.** `data.rooms` is always `undefined`, so
  the room list rendered empty no matter how many rooms the user was in.
  `listMyRooms` now folds both arrays into one list and tags each with its
  membership status.
- **Leaving a room always returned 500.** `POST /rooms/:roomId/leave` writes
  `SET status = 'left', left_at = NOW()`, but no migration ever created
  `left_at` — so the column did not exist and every attempt failed with
  `column "left_at" of relation "room_members" does not exist`. Found by
  calling the endpoint, not by reading it; the frontend had no UI for leaving,
  so nothing had ever exercised it. Fixed by adding the column
  (`003_add_member_left_at.sql`), because the handler's intent is right.
- **Invitations could be sent but never accepted.** The backend has
  `GET /api/invitations` and accept/reject endpoints; the frontend had no
  binding for any of them and rendered nothing. An invitation was therefore a
  dead end, and every room created on someone else's behalf had exactly one
  member — its creator. Both the dispute room and the escrow proposal depended
  on this and quietly did nothing. Fixed with `listInvitations` /
  `acceptInvitation` / `rejectInvitation` and an `Invitations` panel above the
  room list.

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
  `/escrow/new?project=<id>` bridges them for the person filling in the form —
  it pre-fills the builder's address and checks it — but creates no on-chain
  link, and the wizard says so.
- **A recipient check is not identity verification.** `RecipientCheck` reports
  four unforgeable chain facts and one self-asserted profile name, and labels
  which is which. It cannot tell you that an address belongs to the person you
  have been talking to; only that it exists, has been used, and is or is not
  the registered builder of a given project. See `docs/TRUST.md`.
- **Escrow holdings in the wallet menu cost one read per escrow.** The query is
  gated on the menu actually being open. With more than a few dozen escrows per
  wallet this would want an indexer rather than a fan-out.
- **Fee-on-transfer and rebasing tokens will break an escrow.** `fund()` does
  not verify the amount received, so such a token under-delivers and the final
  release reverts. The funder can still recover the real balance by cancelling;
  the developer loses that milestone. This is a contract limitation, disclosed
  in the UI rather than worked around — see `docs/CONTRACTS.md`.
- **Two of the four deploy steps cannot be priced in advance.** The registry
  and the deposit both call a contract that does not exist until step one
  lands. The estimate is a floor, and it can only ever prove "not enough".
- **A developer-approval gate cannot be enforced.** The escrow constructor
  requires only `funder != developer`; there is no notion of the developer
  consenting, and anyone can deploy one directly from a block explorer or a
  script. Any approval flow built here is a workflow agreement, and must say
  so rather than implying the contract checks it. Built as an **EIP-712 signed
  approval** carried over chat: real, non-repudiable evidence that the
  developer agreed to those exact terms, explicitly labelled as unenforced.
- **A dispute can never be withdrawn.** `Disputed` has no path back to
  `Funded`, so raising one permanently ends milestone releases and forces an
  all-or-nothing ending. The previous copy called this "pausing" releases,
  which was wrong.
- **There is one conversation per pair of wallets**, not one per thing they
  are talking about. The key is `pair:<lower>:<lower>` with the two addresses
  sorted, stored in the backend's `context` column (migration
  `002_add_room_context.sql`; nullable and opaque to the server, so every
  existing room and caller is unaffected). Proposal, signature, the escrow
  that resulted and any later dispute all land in the same history, because a
  dispute is argued using what was agreed and the agreement was in the other
  room. The superseded keys — `escrow-proposal:<funder>:<dev>` and
  `escrow:<escrow>:dispute` — are still *looked up* so older rooms resolve;
  they are never created. This replaces matching rooms by display name, which
  broke on rename and failed silently by creating a duplicate.
- **Nothing needs a manual refresh, and nothing polls that cannot change.**
  `refetchOnWindowFocus` was off in the query client, on the reasoning that it
  caused flicker — it does not, because react-query keeps the previous data on
  screen while refetching. What it did cause was having to reload the page to
  find out the counterparty had released a milestone. It is on, alongside
  polling for the three things another person can change while you watch:
  an escrow's on-chain state (20s, and **not at all** once it reaches a
  terminal state, since nothing further can happen), your escrow list and the
  room list (60s), and pending invitations (30s). Every timer pauses while the
  tab is in the background — verified in `queryObserver.js`, which fires the
  interval only when `refetchIntervalInBackground` is set or the window is
  focused. Chat messages themselves are not polled; they arrive on the socket.
  The chat budget is 100 requests per 15 minutes per IP, and the polls
  together use 45.
- **Writes invalidate what they changed.** Deploying an escrow did not
  invalidate the escrow list it then navigated to, and creating a project did
  not invalidate the project list — both relied on the stale window having
  elapsed, which it usually had, which is why it looked intermittent rather
  than broken.
- **Rooms can be left or deleted, and the two are kept separate.** Leaving is
  yours alone; deleting takes the room away from everyone in it and is offered
  only to its admin, because the server returns 403 for anyone else and an
  action that always fails is worse than no action. Deletion is
  `is_active = false`, not an erasure: the messages remain in the database and
  the dialog says so rather than promising they are gone. Deleting a pair room
  destroys the record of the terms proposed and signed in it, so that dialog
  says that too — the escrow contract is on chain and unaffected.
- **A profile name is not identity, and never appears alone.** `Person`
  renders the registered name *and* the wallet, because the registry proves
  only that this address paid to register that string — anyone may register
  any string, including one already in use. `PersonName` (name only) is for
  prose where the address is already on screen beside it. Every surface where
  money or consent is at stake uses `Person`.
- **Name resolution costs one registry read plus one IPFS fetch per distinct
  address.** react-query dedupes by address, so a forty-message transcript
  between two people costs two lookups — but a long public list of escrows
  fans out over every party in it. With a large enough list this wants an
  indexer, the same conclusion as the escrow-holdings panel.
- **Proposed terms travel in the URL, unsigned.** `/escrow/new?proposal=…`
  carries a base64url'd proposal so agreeing an escrow over several days does
  not end with someone retyping amounts from memory into a contract that
  cannot be amended. Anyone can craft one; it fills in a form and nothing
  more. The funder is always the connected wallet rather than the value in the
  link, approval is re-derived from the room and re-verified against the terms
  on screen, and the figures are reviewed before anything is sent. Amounts are
  restored with `formatUnits`, not `formatTokenAmount` — the display formatter
  groups thousands ("1,200"), which the amount field then rejects.
- **The "escrow created" message is a claim by the sender**, like any other
  chat message. It is worth having because it is checkable: the contract at
  that address states its own funder, developer, token and milestones, and the
  card links there rather than restating the terms as if confirmed. It is
  posted best-effort after every deploy step confirms, so a chat failure can
  never read as the escrow having failed.
- **Any ERC20 can be chosen, and the list is not a whitelist.** The five listed
  tokens were each read from Sepolia, but an unlisted token is accepted as long
  as it reports its decimals. That is a deliberate trade: the alternative is
  pretending the contract only accepts what we curated, which it does not.
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
