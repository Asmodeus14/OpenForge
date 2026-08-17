# OpenForge

A workspace for funding open source work through milestone escrow.

A funder deposits into a contract before work begins; the developer can verify
the money is there; each milestone is paid out only when the funder approves
it. Projects, profiles and escrows all live on chain, and their descriptive
content lives on IPFS.

**This is a prototype on the Sepolia test network.** The tokens involved have
no monetary value, the contracts have not been audited, and there is no
arbitration or recovery process. Do not connect a wallet holding real funds.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the values — see below
npm run dev                  # http://localhost:3000
```

| Command | Does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build, including a full type check |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint, including the React Compiler rules |

Before pushing, all three of `npx tsc --noEmit`, `npx eslint .` and
`npm run build` should pass. The build type-checks, so a type error fails it.

---

## Environment

Copy `.env.example` to `.env.local`. Two groups, and the distinction matters.

### Server only — never sent to the browser

| Variable | Purpose |
|---|---|
| `PINATA_JWT` | Pinning credential. Preferred. |
| `PINATA_API_KEY` / `PINATA_API_SECRET` | Fallback credential pair. |

These are read exclusively by `app/api/ipfs/route.ts`. They have no
`NEXT_PUBLIC_` prefix and therefore never reach the client bundle.

> The previous Vite application prefixed these `VITE_`, which compiled them
> into the JavaScript served to every visitor. Anyone loading the site could
> read them out and pin or unpin content with the project's account. Moving
> uploads behind a server route is the reason this app is a Next app.

### Public — safe in the client bundle

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_PINATA_GATEWAY` | Dedicated Pinata gateway host. |
| `NEXT_PUBLIC_PINATA_GATEWAY_TOKEN` | Read-only token scoped to that gateway. |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Sepolia JSON-RPC endpoint. |
| `NEXT_PUBLIC_API_URL` | Chat backend base URL. |
| `NEXT_PUBLIC_SOCKET_URL` | Chat websocket URL. Defaults to the API URL. |

**The dedicated gateway is not optional in practice.** Measured against a real
CID already stored by this project:

| Gateway | Result |
|---|---|
| Dedicated Pinata gateway | 2.4 s cold, **172 ms warm** |
| `ipfs.io` | timed out at 15 s |
| `w3s.link` | timed out at 15 s |
| `dweb.link` | timed out at 15 s |

The old app read only from public gateways behind a 3-second abort, which
means project metadata, avatars and cover images were never loading at all —
a bug that presented as "IPFS is slow". See `lib/ipfs.ts`.

---

## Documentation

| Document | Covers |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Directory layout, server/client split, data flow |
| [docs/DESIGN.md](docs/DESIGN.md) | Design tokens, type scale, component rules |
| [docs/TRUST.md](docs/TRUST.md) | The transaction model, disclosures, money arithmetic |
| [docs/CONTRACTS.md](docs/CONTRACTS.md) | Deployed addresses and every contract behaviour the UI relies on |
| [docs/DECISIONS.md](docs/DECISIONS.md) | What was removed and why; known limitations |

Read `docs/CONTRACTS.md` before changing anything that touches money. It
records several behaviours that are not obvious from the ABI and that the
interface depends on being correct about.

---

## Stack

- **Next.js 16** (App Router) and **React 19**
- **TypeScript**, strict, with `noUnusedLocals`, `noUnusedParameters` and
  `erasableSyntaxOnly`
- **Tailwind CSS v4**, configured in CSS via `@theme inline`
- **ethers v6** for all chain access
- **@tanstack/react-query** for client-side caching
- **Radix UI** primitives, **cmdk** for the command palette
- **socket.io-client** for chat

Deployed only to Sepolia. Everything else is a designed wrong-network state.
