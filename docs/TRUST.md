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
- `formatTokenAmount` takes the token's real `decimals`. tUSDC is **6**, WETH
  is **18**, and the difference is a factor of 10¹².
- **Decimals are never assumed.** An escrow can be denominated in any ERC20, so
  the precision is a property of the chosen token, read from it. A token that
  will not report its decimals is refused rather than defaulted to 18.
- **Changing the currency re-judges every amount.** The selected token is
  derived from the selection rather than copied into state, so `0.123456`
  becomes invalid in the same render that switches to a 2-decimal token — not
  one render later, with a stale verdict still on screen.
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

## Pricing the sequence before it starts

`chain/gas.ts`, shown in the deploy summary.

Creating an escrow is four transactions, and each needs native currency.
Running out after the second leaves a deployed contract holding nothing — not
a loss of funds, but a wasted deployment that has to be redone from scratch.

Two of the four can be priced exactly before anything is sent, and two cannot:

| Step | Priced | Why |
|---|---|---|
| Deploy | **exact** | An ordinary deployment, estimable against current state |
| Approve | **exact** | The spender is the escrow's *predicted* `CREATE` address; an allowance write does not need it to exist |
| Register | no | `registerProject` calls `escrow.funder()`, which reverts while nothing is deployed there |
| Fund | no | Calls `fund()` on a contract that does not exist yet |

Measured on Sepolia: deploy **2,855,175** gas, approve **47,276**, and the
registry estimate refuses with `missing revert data` exactly as predicted.
Deploy is 98.4% of the priceable total, which is why a partial estimate is
still worth showing.

The two unpriceable steps say so and say why. A plausible-looking figure in
those rows would be indistinguishable on screen from the two real ones. The
total is therefore labelled a floor, and **the verdict is one-directional**:
it can tell you a balance is definitely too low, never that it is definitely
enough.

---

## The developer's signed approval

`chain/approval.ts`, `components/escrow/ApprovalGate.tsx`,
`components/escrow/ProposalCard.tsx`.

The funder sends the terms; the developer signs them with their wallet
(EIP-712, no gas, no transaction); the wizard verifies the signature against
the terms currently on screen.

**This is not enforced by the contract, and the UI says so twice** — once to
the developer while signing, once to the funder above the deploy button. The
escrow constructor requires only `funder != developer`; it has no notion of
consent, and anyone can deploy one from a block explorer. What the signature
provides is evidence, not a lock.

That distinction is worth the build because the evidence is real. Verified,
each case asserted independently:

| Case | Verifies |
|---|---|
| Developer signs their own terms | **yes** |
| Funder inflates a milestone afterwards | no |
| Payee swapped to another address | no |
| Token, deadline or description changed | no |
| A milestone appended | no |
| Someone else signs the real terms | no |
| Replayed from a mainnet domain | no |

Design decisions worth keeping:

- **Milestones are signed in full, not as a hash.** A hash shows the developer
  32 opaque bytes and asks them to trust the interface — which is exactly what
  the signature is supposed to make unnecessary. Signing the array means the
  wallet displays every amount and description.
- **Deadlines are signed as days, not timestamps.** The funder does not know
  when they will deploy, so an absolute deadline would drift between signing
  and sending and silently invalidate every signature. "30 days" is also what
  the developer is actually agreeing to.
- **The approval is derived, never stored.** It is re-verified against the live
  form on every render, so editing any field invalidates it immediately rather
  than leaving a stale green tick above a changed number.
- **`chainId` and `verifyingContract` bind it to this deployment**, so an
  approval cannot be replayed against another chain.

Transport is a fenced block inside a chat message, because the chat backend
cannot attach structured data to one. A client that does not understand the
block shows it verbatim rather than losing the message.

### Getting back to it days later

Agreeing terms is not a single sitting. The funder sends them, closes the tab,
and the signature arrives two days afterwards — at which point the form is
empty and the amounts exist only in the conversation. Retyping them is the
worst possible way to fill in a contract that can never be amended, and it is
what the product used to require.

So the proposal card is the way back in: **Create this escrow** reopens the
form at `/escrow/new?proposal=…` with those exact figures. Restoring an amount
is exact rather than approximate — base units are rendered with `formatUnits`
and parse back to the identical `bigint`, verified across 6, 18, 1 and 0
decimal tokens — so the restored terms hash the same and the developer's
signature still matches. Had the display formatter been used, "1,200" would
have been rejected by its own amount field.

The link is unsigned, and nothing rests on it being authentic. The funder is
always the connected wallet rather than the value in the link; approval is
re-derived from the room and re-verified against what is on screen; a
mismatch between the link's stated precision and the token's own decimals
raises a warning rather than being quietly used. A tampered link can pre-fill
a form, which is all a form is for.

The developer gets no such link, because they cannot act on it — the deposit
comes from the funder's wallet. They are told who can, by name. When the
escrow does exist, the funder's client posts its address into the same
conversation, so the thread ends with the outcome rather than with an
unanswered proposal.

---

## Disputes have somewhere to go

`lib/chat/disputeRoom.ts` and `components/escrow/DisputeRoom.tsx`.

The contract offers no arbitration — it only decides who may move money and
when. Everything that actually settles a dispute happens between two people,
and there was previously nowhere for that to happen. When a dispute is open,
each party is offered the conversation they already share with the other, and
the dispute is posted into it.

Three deliberate constraints:

- **Posted on demand, not as a side effect of the dispute transaction.**
  Messaging needs its own signature, which must not be bundled into a
  transaction the user thought was about escrow — and a chat failure must
  never look like the dispute having failed. The dispute is on chain and
  already final by the time the panel appears.
- **The counterparty is invited, never added.** The backend cannot put someone
  in a room without consent, and it should not: being forced into a
  conversation by the person disputing with you is not a feature. The UI says
  the invitation is pending rather than implying they are already reading.
- **The opening message states facts, not a case.** It records who raised it,
  the network, the reason, and the asymmetry — then leaves the argument to
  whoever raised it.

Rooms are matched on a `context` key, not on their display name. Name matching
was the original approach and was wrong: renaming a room orphaned it, and the
failure was silent — the next attempt created a second room rather than
reporting anything. `context` is set at creation, opaque to the server, and
survives renames.

The key is the *pair*, `pair:<lower>:<lower>` with the addresses sorted, so
both parties compute the same value and every exchange between them —
proposal, signature, the escrow it became, this dispute — stays in one
history. That ordering matters here specifically: a dispute is argued from
what was agreed, and separating the argument from the evidence helps nobody.
The earlier per-escrow key (`escrow:0xabc…:dispute`) is still looked up so
existing rooms resolve, but is no longer created.

---

## Checking who gets paid

`components/escrow/RecipientCheck.tsx`, shown under the developer field in the
deploy wizard.

An escrow pays one immutable address, chosen by typing it into a text box.
There is no amendment, no reversal and nobody to appeal to, which makes that
field the least recoverable step in the product. So everything the chain can
say about the address is put on screen before deployment:

| Signal | Source | Forgeable? |
|---|---|---|
| Builder of project *#n* | `ProjectRegistry.getProject` | No |
| Projects built | `ProjectRegistry`, walked | No |
| Transactions ever sent | `eth_getTransactionCount` | No |
| Is a contract, not a wallet | `eth_getCode` | No |
| Profile name and avatar | `ProfileRegistry` → IPFS | **Yes** |

The last row is the reason the panel carries a caveat rather than a checkmark:
a profile proves the address registered that name, not that the person behind
it is who they claim. Rendering a registered name as a verified identity would
be precisely the fabricated assurance the section above exists to forbid. The
copy says so, and tells the reader to confirm the address over a channel they
already trust.

Two signals are shown as cautions, not blocks:

- **Zero transactions** is the strongest available typo detector — a wallet
  nobody has ever used is usually a wallet nobody owns.
- **Is a contract** matters because releases use a plain token transfer; a
  contract that cannot move ERC20s would strand every payment. It is a
  caution and not an error because a smart-contract wallet is a legitimate
  recipient.

Nothing here blocks a deployment. A funder may have a good reason to pay an
address with no history, and a UI that refuses is a UI people learn to fight.

### Naming people without vouching for them

`components/trust/Identity.tsx`.

`0x8E13…799f` is not a person, and a product that shows only addresses forces
users to recognise money by hex. Every address that refers to somebody
therefore resolves through `ProfileRegistry` to the name they registered —
in the transcript, the room list, the proposal card, the escrow's parties,
project and escrow lists.

The rule that keeps that honest is the one from the table above: **the name
never replaces the address.** `Person` renders both, because the registry
proves only that this wallet paid to register that string — anyone may
register any string, including one already in use, and an invitation or a
payment request is exactly where someone would borrow a familiar name.
`PersonName`, which renders the name alone, is used only in prose where the
address is already on screen next to it.

Where there is no profile, the shortened address is the name. Nothing is
invented to fill the space.

### Arriving from a project

`/escrow/new?project=<id>` resolves the project **on the server** and pre-fills
the developer field with its registered builder, so the address on screen came
from the registry rather than from anyone's memory. If the field is then edited
away from that builder, the panel says so explicitly and names the address the
project is actually registered to.

An unknown or malformed id degrades to the ordinary blank form. Creating an
escrow from scratch is a legitimate way to reach this page, so it is not a 404.

The two registries remain disjoint — see `docs/CONTRACTS.md`. Linking them in
the query string is a convenience for the person filling in the form; it
creates no on-chain relationship, and the wizard says as much.

---

## Wallet honesty

- **Assets in the wallet menu** are read with the app's own provider, not asked
  of the extension, so the figures match what the contracts will see. There is
  no fiat conversion: these are testnet tokens with no price, and printing a
  dollar figure beside them would be an invention.
- **"Committed to you"** is labelled as committed, never as a balance. Milestone
  money assigned to a developer is net of the fee and still belongs to the
  funder until released, who may instead cancel an overdue milestone or win a
  dispute.
- **Balances above a billion tokens** are shown compacted, with the exact figure
  on the element for hover and assistive tech. Test balances run to 10^21;
  truncating such a number would render it as a much smaller one, which is
  worse than obviously abbreviating it. `formatCompactNumber` remains banned
  from anything a user is agreeing to.
- **No gas** is called out in the menu with a faucet link, because it blocks
  every transaction and is otherwise discovered only when the wallet rejects
  one.
- **Disconnect** clears local state and says so. A site cannot revoke its own
  permission, and pretending otherwise is a false assurance.
- **Wrong network** is a designed state with a switch action, not a silent
  failure.
- **Sepolia testnet** is stated permanently in the wallet menu, on the landing
  page and in settings — not buried.
- **Chat sign-in** explains that the signature is off-chain, costs no gas and
  grants no permission over tokens. An unexplained wallet prompt is what
  phishing looks like.
