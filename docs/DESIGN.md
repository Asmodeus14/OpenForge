# Design system

Reference implementation: `/design`. Tokens: `app/globals.css`.

The target is quiet, dense, precise — closer to Linear and Stripe than to a
crypto dashboard. Content dominates; chrome recedes.

---

## Tokens

Everything lives in `@theme inline` in `app/globals.css`, which is what makes
the theme swappable at runtime: the Tailwind utilities resolve through CSS
variables rather than being compiled to fixed values.

**Never write a raw colour in a component.** There are none anywhere in
`app/` or `components/` outside the two `theme-color` meta values, and a grep
for Tailwind palette classes (`bg-zinc-900`, `text-purple-600`, …) returns
nothing. Those literals are how a product ends up with nine different greys.

### Surfaces

| Token | Dark | Light |
|---|---|---|
| `canvas` | `#08090a` | `#ffffff` |
| `subtle` | `#0d0e10` | `#fafafa` |
| `surface` | `#121316` | `#ffffff` |
| `elevated` | `#181a1e` | `#ffffff` |
| `line` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.09)` |

Light mode is **designed, not inverted**. Dark mode separates planes by
lightening them; light mode separates them with hairlines and shadow, because
lightening a white surface does nothing.

### Text

`fg` `#f5f5f7` · `fg-secondary` `#a1a1aa` · `fg-muted` `#8b8b94` (dark).

`fg-muted` is the floor, not a free choice. It is only ever set at `meta` (13px)
and `micro` (11px), so it never reaches the large-text threshold and must clear
4.5:1 outright. The current pair — `#6e6e73` light, `#8b8b94` dark — sits at
5.07:1 and 5.91:1. It was previously `#86868b` / `#71717a`, which measured
3.62:1 and 4.12:1 and failed in both themes. Do not darken it back toward
Apple's tertiary grey; that value is calibrated for larger text than this
product uses it at.

### Accent

One restrained violet, and it is rationed: primary actions, the active nav
item, links, and selection. If everything is accented, nothing is.

### Semantic colours

`success` / `warning` / `danger` / `info`, each with `-subtle`, `-line` and
`-text` variants. **Colour never carries meaning alone** — every
`StatusDescriptor` in `lib/status.ts` ships a label and an icon alongside its
tone, so status survives greyscale, colour-blindness and screen readers.

---

## Type

| Token | Size | Use |
|---|---|---|
| `hero` | 36 → 64 fluid | Landing headline |
| `display` | 30 → 48 fluid | Landing section heads |
| `title` | 26 → 32 fluid | Page titles |
| `heading` | 24 | Figures in `Stat` |
| `section` | 20 | Section headings |
| `lead` | 17 | Marketing body |
| `body` | 15 | Application body |
| `secondary` | 14 | Supporting text |
| `meta` | 13 | Metadata |
| `micro` | 11 | Labels, counters, `kbd` |
| `code` | 13 | Mono |

Tracking tightens as size grows — large type needs negative letter-spacing to
avoid reading as loose, and that is most of what makes a headline look
deliberate.

The three largest are `clamp()`d. A fixed 64px headline overflows a 375px
viewport, and solving it in the token beats making every call site remember a
chain of responsive variants.

**Mono is only for machine identifiers**: addresses, hashes, CIDs, token
amounts, IDs. Never for prose, never for decoration.

---

## Layout

`components/ui/Layout.tsx` exists to make the *default* page structure
whitespace and hairlines, not a grid of boxes.

### The logo

`assets/Logo_sheet.png` is the source of truth. `scripts/build-logo.js`
derives every asset from it — `public/logo-mark.png` (alpha-only mark),
`app/icon.png` and `app/apple-icon.png` (white mark on a dark plate). Re-run
the script if the sheet changes rather than hand-editing the outputs.

`components/ui/Logo.tsx` renders the mark as a **CSS mask over
`currentColor`**, not as an `<img>`. That is what makes one asset correct in
both themes. The old committed `openforge.svg` could not do this: its fill was
hardcoded `#000000`, invisible on a dark background.

The wordmark is set in the product's own typeface rather than baked into the
image, so it stays crisp, selectable, and identical to the rest of the UI.

### Layout primitives

- `Page` — width and gutters. `content` (45rem) / `app` (70rem) / `wide` (82.5rem).
- `PageHeader` — title, description, actions. Renders the `<h1>`.
- `Section` — hairline above, generous vertical rhythm.
- `Stat` — a figure and a label, unboxed.
- `Divider`, `Card`.

**`Card` is opt-in.** Reach for it when grouping genuinely aids comprehension
— a single milestone, a transaction summary. A row of `Stat`s separated by
whitespace reads as a summary; the same numbers in six bordered cards read as
an admin panel.

Prefer a table for developer data. `components/ui/Table.tsx` uses row spacing,
one hairline under the head and a hover tint rather than a grid of borders,
and scrolls horizontally inside its own container so the page body never
scrolls sideways.

---

## Motion

| Token | Duration |
|---|---|
| `--dur-instant` | 100 ms |
| `--dur-fast` | 160 ms |
| `--dur-base` | 220 ms |
| `--dur-slow` | 320 ms |

`--ease-out: cubic-bezier(0.32, 0.72, 0, 1)` — the decelerating curve that
makes a surface feel like it settled rather than stopped.

Motion is confined to state changes: hover tints, overlay entrances and exits,
a barely-perceptible `active:scale-[0.98]` on press. Nothing decorative,
nothing that delays content.

**Every surface that animates in animates out.** Radix unmounts a closed
surface immediately unless it finds an animation on `[data-state="closed"]`, so
an enter-only rule does not read as fast — it reads as the element being
deleted. Exits run at `--dur-fast` against the enter's `--dur-base`: leaving
should be quicker than arriving. Both directions keep `--ease-out`.

**The command palette is the exception, in both directions.** It is reached by
⌘K dozens of times a day, and an animation the user out-types reads as lag
rather than polish. Only its backdrop fades. This is a rule about frequency,
not about overlays — nothing else should copy it.

### Reduced motion

`prefers-reduced-motion` asks for less **movement**, not for a still image. The
risk it guards against is vestibular, and that comes from travel through space
— sliding, parallax, zooming, panning. Opacity and colour carry none of it.

So durations are **not** zeroed and nothing is globally silenced. Instead the
four overlay keyframes are redefined under the query to cross-fade in place.
They omit `transform` on purpose: a keyframe that does not mention a property
leaves the element's own value alone, which is what keeps the modal centred —
its `-translate-x-1/2 -translate-y-1/2` would otherwise be overridden for the
length of the animation and throw it into a corner.

That block lives **after** the keyframes it replaces and **outside**
`@layer base`. `@keyframes` resolve by layer first and document order second,
and unlayered beats layered, so the same rules written inside the base layer
would lose to the originals and silently do nothing.

Kept deliberately: `animate-spin`, `active:scale-[0.98]`, and the disclosure
chevron's rotate — all in place, under 20px, and all the interface answering
the user rather than decorating itself. A spinner especially: the previous
blanket `animation-duration: 0.01ms !important` did not shorten it, it stopped
it on frame one, leaving a wallet transaction that can run for minutes with no
sign it was still going.

Sonner disables its own toast slide under this query, so that motion needs no
catching here.

**If you add motion that travels, add its reduced-motion variant beside it.**
There is no global net any more; the net was what broke the spinners.

---

## Components

`components/ui/` primitives carry no domain knowledge. `components/trust/`
owns identity, money and network. Everything else is domain-specific.

Rules that are enforced rather than suggested:

- **Pages never hand-render an address or an amount.** That is how "$1,200"
  ends up meaning two different things on two screens. Use `AddressDisplay`
  and `TokenAmount`.
- **`IconButton` requires a `label`.** An icon is not a name, for a screen
  reader or anyone else. It doubles as the tooltip.
- **Inputs always have a visible label.** Placeholder text disappears the
  moment someone types, taking the only explanation of the field with it.
- **Skeletons, not spinners**, for page-level loading — and they must mirror
  the real layout closely enough that nothing shifts when content lands.
  `Spinner` is for in-button waits only.
- **Every empty state says what is empty, why, and what to do next.** "No data
  found" is not acceptable.
- **Errors are translated.** `ErrorState` renders plain language with the raw
  detail collapsed behind a disclosure. A revert string tells a user nothing.
- **A toast is for an outcome the user cannot already see.** `Toaster` exists
  for the narrow case where the thing acted on *disappears along with its own
  label* — leaving a conversation, deleting a room. It is wrong for anything
  already visible (a copied address turns its icon into a tick; a deleted
  message vanishes from the transcript), wrong for errors, which must persist
  and carry their detail, and never used for money. Anything involving funds
  goes through `TransactionFlow`, which the user dismisses deliberately.

### Dialogs

Radix supplies focus trapping, focus restore, Escape, scroll lock and the ARIA
wiring; this codebase supplies only the visual language. Hand-building those
is where dialog accessibility usually breaks — the old `Modal.tsx` had no
portal, no Escape handler, no focus trap and no `role="dialog"`.

`ConfirmDialog` is for irreversible **non-financial** actions. Anything
involving money goes through `TransactionFlow`.

---

## Accessibility

- Focus is a ring, never a border change, so focus never shifts layout.
- A skip link precedes the shell.
- One `<h1>` per page, from `PageHeader` or the page itself.
- Landmarks: `<nav aria-label>`, `<main id="main">`, `<header>`, `<footer>`.
- Every `target="_blank"` carries `rel="noreferrer noopener"` — verified by
  grep across the codebase.
- Every `<button>` has an explicit `type` — likewise verified.
- No `onClick` on a non-interactive element without a role and key handler.
- Tag inputs generate their DOM ids with `useId`, so two on one page cannot
  collide.

## Responsive

Breakpoints do the work; there is no JavaScript-driven layout. The old app
tracked `windowWidth` in React state and threaded `useMediaQuery` into some
forty inline style props.

- **< 1024px** — sidebar becomes a drawer; a fixed bottom tab bar carries the
  four primary destinations, clearing the home indicator via
  `env(safe-area-inset-bottom)`.
- **< 768px** — the messages layout shows either the room list or the
  transcript, with an explicit back control. Without it, selecting a room on a
  phone is a dead end.
- Tables scroll inside their own container; secondary columns hide below `sm`.
