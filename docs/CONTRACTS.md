# Contracts

Everything here was verified against the sources in `OpenForge-Contracts` and
the deployment records, with no ABI drift. **Read this before changing
anything that touches money.** Several of these behaviours are not visible
from the ABI, and the interface depends on being correct about them.

All addresses are on **Sepolia (chain 11155111)** and are defined once, in
`chain/config.ts`.

| Contract | Address |
|---|---|
| `ProfileRegistry` | `0xb8c5a55D3b0E838e2f96cBdF893f90c5362F3E46` |
| `ProjectRegistry` | `0x8796CbE1a841690E51DB3212C88533c0213c66d2` |
| `OpenForgeProjectRegistry` | `0x19B0aB8A58684F2d4C8E1B0cC4D3e9Ad73d0d59a` |
| `TestUSDC` (6 decimals) | `0xbe82627f5d7ba5774df41dacdb2415b66ab2b780` |
| Fee recipient (EOA) | `0xC869d7a99fa831b4B3bEe7e245F0C9348C2209a3` |

`TestUSDC` is the default currency, not the only one — see [Tokens](#tokens).

`SimpleMilestoneEscrow` has no fixed address — one is deployed per project
from bytecode embedded in `chain/abi/escrow.ts`.

---

## SimpleMilestoneEscrow

### Constructor requirements

Every one of these reverts, so the deploy form checks them first rather than
letting a user pay gas for a failure:

- funder, developer and token must all be non-zero
- **funder must not equal developer**
- at least one milestone
- the three milestone arrays must be the same length
- **every milestone amount must be greater than zero**

A deadline of `0` is accepted and means "no deadline".

### The fee

`FEE_BASIS_POINTS = 150`, i.e. **1.5%**, sent to a hardcoded EOA. It is
charged **only** in `releaseMilestone`. Nothing is taken on cancellation or on
either dispute resolution path.

```solidity
uint256 feeAmount = (milestone.amount * 150) / 10000;
uint256 developerAmount = milestone.amount - feeAmount;
```

Solidity's division truncates, so **the fee must be computed per milestone and
summed, never taken on the total.** On a 6-decimal token the two methods can
disagree. `totalFeeFor()` in `components/escrow/intents.tsx` does it the way
the contract does.

### Gross versus net — the trap

```solidity
releasedAmount += milestone.amount;                        // GROSS
emit MilestoneReleased(index, developerAmount, feeAmount); // NET
```

`releasedAmount` accumulates the **gross** amount while the event reports the
**net** amount. They are different numbers for the same event and must never
be added together or compared. The escrow detail page labels its Released
figure "Before fees" for exactly this reason.

The release button names the **net** amount, because that is what the
developer receives. Naming the gross figure would overstate their pay by the
fee on every screen.

### Deadlines do not gate payment

```solidity
// REMOVED: Deadline check - funder can release even after deadline
```

A deadline only unlocks the funder's ability to **cancel** that milestone. So
"Overdue" is informational, not a blocker, and the milestone list presents it
that way.

`cancelMilestone` additionally requires `deadline > 0`, so **a milestone with
no deadline can never be cancelled individually.** The deploy form discloses
this before the choice is made.

### Where cancelled money goes

`cancelMilestone` calls `safeTransfer(funder, milestone.amount)` — the amount
goes **straight back to the funder's wallet**, immediately. It is not held for
reallocation. The confirmation copy says so.

### `_getRemainingBalance()`

Returns the contract's **live token balance** (and `0` while state is
`Created`). So `cancelProject`, `resolveDisputeToFunder` and
`resolveDisputeToDeveloper` all move exactly the live balance, which is what
`EscrowDetail.contractBalance` reports. Those confirmation dialogs can quote
it directly.

### The dispute asymmetry

| Party | May resolve in their own favour |
|---|---|
| Funder | **Immediately** |
| Developer | Only after **30 days** |

The developer has no other power: they cannot release, cancel, or withdraw.
This materially disadvantages them, so it is disclosed twice — in the dispute
dialog, phrased from the reader's own position, and in the escrow's action
panel.

### Descriptions come from `getMilestones()`

`OpenForgeProjectRegistry.getEscrowInfo()` appends `" (Deadline: N days)"` to
every description. Reading from there renders the deadline twice, once inside
the title. Always read raw descriptions from `escrow.getMilestones()`.

---

## ProfileRegistry

A hard **14-day** cooldown between edits. There is no owner, no override and
no way to shorten it.

This is surfaced *before* the form is submitted — `getUpdateAvailability()`
reports when the next edit becomes possible, the edit button is disabled with
the remaining time in its label, and the confirmation dialog repeats it. The
previous implementation discovered the cooldown by parsing the revert message
after the transaction had already failed and cost gas.

`buildProfileMetadata` preserves `createdAt` across updates. The old builder
wrote `createdAt: isUpdate ? undefined! : now`, which dropped the key on every
edit and permanently destroyed the original creation date.

---

## ProjectRegistry

IDs start at **0**. States: `Draft → Funding → {Completed | Failed}`, never
backwards. Metadata becomes immutable once a project leaves `Draft`;
`Completed` and `Failed` are terminal.

`allowedProjectTransitions()` in `lib/status.ts` mirrors this so impossible
transitions are disabled in the interface rather than reverting in a wallet.

`getProject()` carries a `validProject` modifier and **reverts** for an
out-of-range id, which is why `loadProject` returning `null` correctly means
"no such project" and the page can 404.

---

## OpenForgeProjectRegistry

A **different** contract from `ProjectRegistry`, and disjoint from it:

| | `ProjectRegistry` | `OpenForgeProjectRegistry` |
|---|---|---|
| IDs start at | 0 | 1 |
| Holds | Project metadata | The index of deployed escrows |
| Shared state | — none — | — none — |

The two are not reconciled anywhere, and nothing in the UI implies they are.

`registerProject()` may only be called by the escrow's funder. **If it is
skipped the escrow has no index entry and becomes undiscoverable** — there is
no factory event to recover it from. That is why registration is step two of
the deploy flow rather than an optional extra.

---

## A dispute cannot be withdrawn

There is no `withdrawDispute`, and no path from `Disputed` back to `Funded`.
Every transition involving a dispute:

| From | Call | To | Effect |
|---|---|---|---|
| `Funded` | `raiseDispute` (either party) | `Disputed` | — |
| `Disputed` | `resolveDisputeToFunder` (funder, **immediately**) | `Cancelled` | All remaining goes to the funder |
| `Disputed` | `resolveDisputeToDeveloper` (developer, **after 30 days**) | `Completed` | All remaining goes to the developer |

Both exits are terminal. `releaseMilestone`, `cancelMilestone` and
`cancelProject` are all `inState(Funded)`, so once a dispute is open **no
further milestone can ever be released and no milestone can be cancelled
individually**. The escrow can now only end all-or-nothing.

This makes raising a dispute far more consequential than it sounds. The UI
previously described it as pausing releases — it does not pause anything, it
ends milestone work permanently. Both the dispute dialog and the escrow's
disputed banner now say so before the transaction is signed.

---

## Tokens

The escrow takes the token address as a constructor argument and assumes
nothing about it, so **any ERC20 may be used**. `chain/config.ts` lists five as
a convenience; `TokenSelect`'s custom-address field covers the rest.

| Symbol | Address | Decimals | Source |
|---|---|---|---|
| `tUSDC` | `0xbe82627f…b2b780` | 6 | OpenForge's own test token |
| `USDC` | `0x1c7D4B19…9C7238` | 6 | Circle's official Sepolia token |
| `WETH` | `0xfFf99767…4d6B14` | 18 | Canonical Sepolia WETH |
| `DAI` | `0xFF34B3d4…b8a357` | 18 | Aave's Sepolia faucet |
| `LINK` | `0x779877A7…624789` | 18 | Chainlink |

Every row above was read from Sepolia before being listed: the symbol, name
and decimals are what each contract reports about itself.

That verification is the whole point. The previous token picker offered
mainnet USDT, USDC, DAI and WBTC — none of which exist on Sepolia — and
labelled `0x779877A7…` "Sepolia USDC" **at 6 decimals**. That address is
Chainlink LINK and it has **18**. Approving it would have moved the wrong
asset, in an amount wrong by a factor of 10¹².

Note that two listed tokens both report the symbol `USDC`, which is why the
picker shows provenance rather than symbols alone.

### Why a wider list is not a wider risk

Safety here does not come from restricting the list — it comes from never
guessing `decimals`. `chain/erc20.ts` short-circuits to the table above for
known addresses and probes anything else; a token that will not report its
decimals throws `UnreadableTokenError` and cannot be selected. Verified
against Sepolia: an unlisted ERC20 resolves, while a plain wallet address, a
non-ERC20 contract and the zero address are all refused.

### The one hazard a picker cannot remove

`fund()` transfers `totalAmount` and moves straight to `Funded` without
checking what actually arrived:

```solidity
paymentToken.safeTransferFrom(msg.sender, address(this), totalAmount);
state = ProjectState.Funded;
```

So a **fee-on-transfer or rebasing token** leaves the contract holding less
than the milestones add up to. Releases pay out per-milestone amounts, so the
shortfall surfaces on the final release, which reverts.

The funds are not lost: `cancelProject()` and `resolveDisputeToFunder()` both
refund `_getRemainingBalance()`, which reads the real `balanceOf`, so the
funder can always recover what is genuinely there. The developer is the party
who loses the last milestone. `TokenSelect` states this in full before an
unlisted token can be used, and none of the listed tokens behave this way.
