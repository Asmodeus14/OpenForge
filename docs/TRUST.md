# The trust model

This product asks people to lock money in a contract that nobody can reverse.
Everything below exists because of that.

The rule underneath all of it: **the interface must never be more confident
than the facts.** It may not claim funds are safe when it cannot know, invent
a figure it has not read, or hide a term because the term is unflattering.

---

## Every write goes through one primitive

`hooks/useTransaction.ts` owns the lifecycle; `components/trust/TransactionFlow.tsx`
renders it. No page implements its own version, so no page can implement a
weaker one.

```
idle ──start()──► confirming ──confirm()──► running ──► success
                      │                        │
                    cancel()                   └────► error
```

A `TxIntent` is what a page provides:

| Field | Purpose |
|---|---|
| `title` | What is about to happen. |
| `actionLabel` | The button. Must name the consequence. |
| `irreversible` | Renders the "cannot be undone" treatment. |
| `facts` | WHAT / WHO / HOW MUCH / WHERE. |
| `disclosures` | Fees, locks, asymmetries. |
| `failureReassurance` | Only shown when it is actually true. |
| `successSummary` | What happened, in the user's terms. |
| `steps` | Every wallet prompt, named in advance. |

### Action labels name the consequence

Never "Continue", "Proceed" or "Confirm".

- `Release 1,182 tUSDC` — and that is the **net** figure, what the developer
  actually receives
- `Deposit 1,200 tUSDC`
- `Return remaining funds to me`
- `Claim available in 24d 6h` (disabled, with the reason in the label)

### Facts are built from the same components as the page

`TxFact.value` is a `ReactNode`, and the intent builders in
`components/escrow/intents.tsx` construct facts with the same `TokenAmount`
and `AddressDisplay` components the pages use. A figure in a confirmation
dialog is therefore produced by identical code to the figure on the page
behind it — the two cannot drift apart.

### Multi-step flows show every step

Deploying an escrow takes four transactions: deploy, register, approve,
deposit. All four are listed with their purpose *before* the first wallet
prompt, so the number of prompts is never a surprise, and each shows its own
status and transaction hash as it runs.

While a transaction is in flight the dialog is not dismissable. Closing
mid-flow would leave someone with no record of what they had just signed.

---

## Honest failure

This is the part most products get wrong.

```ts
const canReassure =
  state.phase === 'error' &&
  fundsCertainlyUnmoved(state.error.kind) &&
  !state.steps.some((s) => s.phase === 'confirmed');
```

"Your funds have NOT been released" is shown only when **both** hold: the
failure kind rules out a state change, **and** no earlier step already
confirmed. If an approval succeeded and the deposit then failed, something did
change on chain, and the UI says so instead:

> *2 of 4 steps completed before this failure. Those transactions are on chain
> and were not reverted.*

On a network error it adds a further warning to check the explorer before
retrying, so the same transaction is not sent twice.

---

## Disclosure, at the point of decision

Not in a footer, not in a help page. Beside the button.

| Where | What it says |
|---|---|
| Release | The 1.5% fee, the net figure, that it cannot be undone |
| Cancel milestone | That the money returns to the funder's wallet immediately, and that no fee is charged |
| Cancel project | That the developer is not paid for unreleased work, and that Cancelled is final |
| Raise dispute | The 30-day asymmetry, **phrased from the reader's own position** |
| Deploy escrow | Four confirmations, the funder's total control, the fee, the dispute asymmetry |
| Deadline field | That a deadline does not gate payment, and that a milestone with none can never be cancelled |
| Profile edit | The 14-day lock, before submit and again in the dialog |
| Project status | That leaving Draft makes the metadata permanent |

The developer's dispute copy is deliberately blunt, because the mechanism
disadvantages them:

> *The funder can end this dispute in their own favour and reclaim the escrow
> immediately. You cannot claim the funds until 30 days have passed. Raising a
> dispute does not protect your payment.*

Softening that would be the single most dishonest thing this interface could
do.

---

## Money arithmetic

- Amounts are `bigint` end to end. No floats touch a value that will be signed.
- `formatTokenAmount` takes the token's real `decimals`. tUSDC is **6**.
- `parseTokenAmount` **refuses** excess precision rather than rounding.
  Silently truncating `10.1234567` to 6 decimals would change the number the
  user believes they are committing.
- The fee is summed per milestone, matching Solidity's truncating division.
- Compact notation (`1.2M`) is for dashboards only, never for an amount
  someone is about to approve.

---

## No fabricated data, no fabricated assurance

Nothing in this application displays a number it did not read. There are no
placeholder statistics, no invented testimonials, no seeded activity.

What was removed rather than restyled:

- A landing page asserting "2,500+ Active Projects", "$15.7M+ Total Funding",
  "32,000+ Creators", "96% Success Rate", three named people with dollar
  figures, "150+ countries" and "AI Matching" — none of which came from
  anywhere.
- A help centre claiming 53 articles (6 existed), view counts, and "2 hour
  average response / 98% satisfaction".
- A project page rendering `stars: 0`, `contributors: 0` and
  `funding: {target: 0, raised: 0}` as though live; they were literals.
- A fabricated `'Web3 Builder'` biography for anyone without one, and a
  "Technology Used" section produced by regex-matching keywords against free
  text.
- A contact form that was a 1.5 s `setTimeout` which always reported success
  and sent nothing.
- A settings page of switches with no handlers, footed by "Settings are
  automatically saved".

Security claims are held to the same standard. The landing page states what
the contract guarantees **and what it does not**, including that the funder
holds the power, that the dispute mechanism is asymmetric, that there is no
arbitration, and that the contracts are unaudited.

### The upload path

`lib/ipfs-upload.ts` throws on every failure and has no fallback. The previous
implementation, when pinning failed, fabricated a `bafybeimock…` CID, stored
the document in `localStorage`, **wrote that fake identifier to the
blockchain**, and reported success — producing an on-chain project whose
metadata no other browser could ever resolve.

An upload that did not happen must fail loudly.

---

## Wallet honesty

- **Disconnect** clears local state and says so. A site cannot revoke its own
  permission, and pretending otherwise is a false assurance.
- **Wrong network** is a designed state with a switch action, not a silent
  failure.
- **Sepolia testnet** is stated permanently in the wallet menu, on the landing
  page and in settings — not buried.
- **Chat sign-in** explains that the signature is off-chain, costs no gas and
  grants no permission over tokens. An unexplained wallet prompt is what
  phishing looks like.
