# Architecture

## Directory layout

```
app/
  page.tsx              Landing page. Public, static, no app shell.
  layout.tsx            Root layout: fonts, theme script, providers.
  global-error.tsx      Last-resort boundary. Self-styled — the design
                        system may be exactly what failed.
  robots.ts
  api/ipfs/route.ts     Server-side pinning. Holds the Pinata credentials.
  design/               Internal design-system reference. Not indexed.
  (app)/                Everything behind the application shell.
    layout.tsx          Top bar, sidebar, mobile tab bar, command palette.
    error.tsx           Route error boundary.
    overview/  projects/  escrow/  discover/  profile/  messages/  settings/

components/
  ui/                   Design-system primitives. No domain knowledge.
  trust/                Address, amount, network, fact list, transaction flow.
  escrow/  projects/  profile/  chat/    Domain components.
  layout/  navigation/  theme/  wallet/  marketing/    Shell and chrome.

chain/                  Contract access. Typed wrappers, no React.
  config.ts             Networks, tokens, addresses, protocol constants.
  clients.ts            Browser provider, signer, and a read-only provider.
  abi/                  ABIs and the escrow bytecode.

lib/                    Pure helpers. format, status, errors, ipfs, project,
                        profile, cn, navigation, chat/, server/.
hooks/                  useWallet, useTransaction, queries, chat hooks.
types/                  Shared types, including the global `window.ethereum`.
```

## The server/client split

Next's default is a Server Component, and that default is kept wherever it
buys something real.

**Rendered on the server:**

- The landing page, entirely static.
- `/discover` and `/projects/[projectId]` — the chain and IPFS are read on the
  server, so the first paint already contains content, the page is indexable,
  and there is no client-side RPC waterfall.
- `/profile/[address]` — a link people share, so it must work without
  JavaScript and produce a correct status code.
- `app/api/ipfs` — because it holds credentials.

**Client Components**, marked `'use client'`, are the pieces that genuinely
need the browser: anything reading a wallet, anything with a dialog, anything
subscribing to a socket.

Two consequences that are easy to get wrong and are handled explicitly:

1. `components/ui/buttonStyles.ts` has **no** `'use client'` directive, so
   Server Components can call `buttonClasses()`. Everything exported from a
   client module — even a pure string function — is unreachable from the
   server, and putting the style function in `Button.tsx` broke the build.
2. A `<Link>` that looks like a button uses `buttonClasses()` on the link
   itself. Wrapping a `Link` in a `Button` produces a `<button>` containing an
   `<a>`, which is invalid HTML and breaks keyboard and screen-reader
   behaviour.

## Data flow

```
Server Component ──► lib/server/*.ts ──► chain/*.ts ──► ethers ──► Sepolia
                            │
                            └────────► lib/ipfs.ts ──► Pinata gateway

Client Component ──► hooks/queries.ts ──► react-query cache ──► chain/*.ts
```

`lib/server/*` modules import `server-only`, so importing one from a client
component fails the build rather than leaking a server path into the bundle.

### Caching

| Layer | Policy | Why |
|---|---|---|
| Chain reads (client) | 30 s stale | Chain data is not real-time; this avoids refetch storms. |
| IPFS by CID | Infinite | Content at a CID is immutable by definition. |
| Token allowance | 10 s | An approval made in another tab must be seen quickly. |
| `/discover` | `revalidate = 30` | Listing freshness against RPC cost. |
| `/profile/[address]` | `revalidate = 300` | The contract permits one edit per 14 days. |
| Chat history | Infinite, no refetch on focus | Superseded by the socket; a refetch would overwrite live messages. |

### `loading.tsx` and 404 status codes

`loading.tsx` exists for `/overview` and `/discover` only.

A loading file makes Next stream the response, which flushes a `200` header
before the page component runs. `notFound()` then renders the 404 page **with
a 200 status**. This was measured, not assumed:

| Route | With `loading.tsx` | Without |
|---|---|---|
| `/profile/nope` | 200 | 404 |
| `/projects/99999` | 200 | 404 |

So no dynamic route that can legitimately 404 has one. Both files carry a
comment saying so, because the fix looks like a missing feature.

## Transactions

Every write path goes through `hooks/useTransaction.ts`, and every one is
rendered by `components/trust/TransactionFlow.tsx`. No page implements its
own confirm-sign-pending-confirmed sequence, so none of them can implement a
weaker one. See [TRUST.md](TRUST.md).

## Chat

REST for the initial load and for writes; the socket for everything after.
The backend allows **100 requests per 15 minutes per IP**, a budget polling
would exhaust in minutes.

One socket per session, and it stays connected across room changes. The
previous implementation listed the selected room in its effect dependencies
and so tore the connection down and rebuilt it on every room switch.
