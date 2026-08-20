# Contributing

Thanks for looking. This is a small project with strong conventions, and most
of them exist because breaking them once cost real time.

## Before you start

Read [docs/CONTRACTS.md](docs/CONTRACTS.md) if you are touching anything that
moves money. It records contract behaviours that are not visible in the ABI and
that the interface depends on being correct about — mangled milestone
descriptions, gross versus net release amounts, and the asymmetry between what
a funder and a developer can do.

[docs/DECISIONS.md](docs/DECISIONS.md) records what was deliberately removed
and why. If something looks missing, check there before rebuilding it.

## Setting up

```bash
npm install
cp .env.example .env.local     # fill in the values — see README
npm run dev                    # http://localhost:3000
```

The chat features need the backend running too; without it, everything except
`/messages` still works.

## Before opening a pull request

All three must pass:

```bash
npx tsc --noEmit
npx eslint .
npm run build
```

`npm run build` type-checks, so a type error fails it. There is no test runner;
correctness is verified with scripts under `scripts/`, which run against the
real Sepolia deployment:

```bash
npx tsx scripts/verify-core.ts       # chain + IPFS layer
npx tsx scripts/verify-errors.ts     # error classification
```

If you fix something subtle, adding a script there is more useful than
describing the fix in the pull request.

## House style

**Comments say why, not what.** The code already says what it does. A comment
earns its place by recording the thing that is not visible: the measurement
that motivated a change, the failure mode being guarded against, the reason an
obvious approach was rejected.

```ts
// Awaiting `hasProfile` before starting `getProfile` made this two HTTP round
// trips; concurrently, ethers folds them into a single JSON-RPC batch.
```

**Never fabricate data.** No placeholder statistics, invented testimonials,
mock CIDs, or numbers that look live but are hardcoded. If a value cannot be
obtained, the interface says so. An earlier version of this app displayed
hardcoded zeroes as though they were real figures and wrote fake IPFS hashes to
the chain; both are why this rule is written down.

**Never claim a security property that does not hold.** The contracts are
unaudited and the README says so. Keep it that way.

**Measure before optimising, and say what you measured.** Several changes here
were reversed after measurement showed the obvious cause was wrong — the
backend's latency turned out to be round-trip count rather than query time, and
the IPFS gateway that was chosen for being fast had stopped being fast.

**Errors must be honest about outcomes.** A failure message must not imply a
transaction was sent when it was not, and must not imply funds are safe unless
that is known. See `lib/errors.ts`.

## Commits

Write the subject as an instruction, lower case after the first word, no
trailing period:

```
Stop shipping an icon library to render eleven icons
```

The body explains why the change was needed and what was measured or verified.
Assume the reader is you in six months with no memory of today.

Keep unrelated changes in separate commits.

## Reporting bugs

Open an issue with what you did, what happened, and what you expected. For
anything on chain, include the transaction hash and the network.

For anything exploitable, do not open an issue — see [SECURITY.md](SECURITY.md).

## Code of conduct

Participation is covered by our [Code of Conduct](CODE_OF_CONDUCT.md).
