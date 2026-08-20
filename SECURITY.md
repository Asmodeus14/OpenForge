# Security

## Status of this project

OpenForge is a **prototype on the Sepolia test network**. Before anything else
on this page, the things a security policy usually implies and this project
does not have:

- **The contracts have not been audited.** By anyone. They were written for
  this project and reviewed only by the people who wrote them.
- **The contracts have no test suite**, and were compiled with the optimiser
  disabled.
- **There is no arbitration, recovery or upgrade path.** A contract that holds
  tokens incorrectly holds them permanently. There is no admin key that can
  intervene, which is a deliberate property and also means nobody can help you.
- **No bug bounty is offered.** There is no budget to pay one, and saying
  otherwise would be dishonest.

Tokens on Sepolia have no monetary value. **Do not connect a wallet holding
real funds, and do not deploy this to a network where they do.**

## Reporting a vulnerability

Report privately through GitHub's **Report a vulnerability** button, under the
Security tab of the affected repository. That opens a private advisory visible
only to the maintainers.

Please do not open a public issue for anything that could be exploited before
it is fixed.

A useful report says what an attacker can do, and how you know — a transaction
hash, a request, or a snippet that reproduces it. A single sentence with those
is worth more than a long report without them.

Given the project's size, expect a reply in days rather than hours. No formal
response window is promised here because none could be honoured reliably.

## Scope

In scope:

| Repository | What matters most |
|---|---|
| `OpenForge-Contracts` | Anything that moves, locks or strands tokens; access control on escrow actions; fee arithmetic |
| `OpenForge-frontend` | Anything that causes a user to sign a transaction that does not match what the interface showed them |
| `OpenForge-Backend` | Authentication, room membership and message authorisation |

Out of scope, because they are already known and documented rather than
undiscovered:

- Anything requiring mainnet funds — the project is testnet-only by design.
- The absence of contract tests and audits, stated above.
- Rate limiting being per-IP and therefore trivially distributed.
- Free-tier availability. The backend sleeps when idle.
- The known limitations recorded in [docs/DECISIONS.md](docs/DECISIONS.md).

## Known weaknesses

These are real, understood, and either accepted for a prototype or not yet
fixed. They are listed so that nobody has to rediscover them.

**Escrow power is asymmetric, by design and by accident.** The funder can
cancel the project or resolve a dispute in their own favour immediately. The
developer must wait 30 days to resolve one in theirs. The interface discloses
this at the point of decision, but it remains an asymmetry a developer must
accept before starting work.

**The fee recipient is a fixed address baked into the factory.** It cannot be
changed after deployment.

**Chain reads go through a public RPC endpoint by default.** It is keyless, and
correspondingly unreliable and unauthenticated. A hostile endpoint could
misreport chain state to the interface. It cannot forge a signature or move
funds — every write is signed in the user's own wallet against data the wallet
displays independently.

**Pinning credentials live on the server, and gateway tokens in the browser.**
The gateway token is read-only and scoped to one gateway. The pinning
credentials are used only by the `/api/ipfs` route handler and never sent to
the client. An earlier Vite version of this app did ship them to the browser;
any credential from that era must be treated as public and rotated.

**Chat authentication is a signed nonce exchanged for a JWT.** The JWT is held
in `localStorage`, so any script running on the page can read it. It grants
access to messaging only — it cannot authorise a transaction or move funds.

## If you are running your own deployment

- Generate a fresh `JWT_SECRET`. Never reuse the one from any example.
- Set `CORS_ORIGIN` to your exact origins, **including the scheme**. An entry
  without `https://` matches nothing and fails in a way that looks like an
  outage.
- Keep the Pinata credentials out of any variable prefixed `NEXT_PUBLIC_`.
  That prefix compiles the value into the browser bundle.
- Rotate every credential that has ever appeared in a client bundle, a commit,
  or a screenshot.
