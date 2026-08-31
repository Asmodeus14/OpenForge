import {
  Check,
  ChevronDown,
  Clock,
  Compass,
  FolderGit2,
  HandCoins,
  LayoutGrid,
  MessageSquare,
  Search,
  Settings,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/ui/Logo';
import { DEFAULT_CHAIN, PROTOCOL } from '@/chain/config';
import { feePercent } from '@/lib/format';

/**
 * The product, as the hero image.
 *
 * Real DOM rather than a screenshot: it themes itself, stays sharp at any
 * pixel density, costs no image bytes, and cannot go stale the way a PNG of a
 * UI does the first time the UI changes.
 *
 * Every figure in it is arithmetically real. The milestones sum to the total,
 * the fee is `PROTOCOL.feeBasisPoints` applied to the released amount, and the
 * net is what the developer would actually receive. This page has a documented
 * rule against inventing numbers, and a hero mock is not an exemption — it is
 * the most-looked-at number on the site.
 *
 * A Server Component. Nothing here is interactive, and pretending otherwise
 * with hover states on a picture of an app is a small lie that people notice
 * the moment they try to click it.
 */

const TOKEN = 'tUSDC';

/**
 * The application's actual navigation, in its actual groups.
 *
 * Taken from `lib/navigation.ts` rather than invented. The reference mock this
 * was composed against lists Pipelines, Environments, Deployments and
 * Artifacts — none of which exist here, and a sidebar advertising four screens
 * that do not open is a promise the product cannot keep.
 */
const NAV = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', icon: LayoutGrid, active: false },
      { label: 'Projects', icon: FolderGit2, active: false },
      { label: 'Escrow', icon: Wallet, active: true },
    ],
  },
  {
    label: 'Ecosystem',
    items: [
      { label: 'Discover', icon: Compass, active: false },
      { label: 'Funding', icon: HandCoins, active: false },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Messages', icon: MessageSquare, active: false },
      { label: 'Settings', icon: Settings, active: false },
    ],
  },
];

const MILESTONES = [
  { n: 1, title: 'Design system and authentication', amount: 1200, status: 'released' as const, when: 'Released 14 Feb' },
  { n: 2, title: 'Payments dashboard', amount: 2400, status: 'held' as const, when: '18 days left' },
  { n: 3, title: 'Migration and handover', amount: 1400, status: 'held' as const, when: '46 days left' },
];

const TOTAL = MILESTONES.reduce((sum, m) => sum + m.amount, 0);
const RELEASED = MILESTONES.filter((m) => m.status === 'released').reduce((s, m) => s + m.amount, 0);
const HELD = TOTAL - RELEASED;
const FEE_BPS = Number(PROTOCOL.feeBasisPoints);
const RELEASED_FEE = (RELEASED * FEE_BPS) / 10_000;

const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

function Pill({ tone, children }: { tone: 'success' | 'accent'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-micro font-medium whitespace-nowrap',
        tone === 'success'
          ? 'border-success-line bg-success-subtle text-success-text'
          : 'border-accent-line bg-accent-subtle text-accent-text',
      )}
    >
      {tone === 'success' ? (
        <Check className="size-3 shrink-0" aria-hidden />
      ) : (
        <Clock className="size-3 shrink-0" aria-hidden />
      )}
      {children}
    </span>
  );
}

export function DashboardMock({ className }: { className?: string }) {
  return (
    <div
      // `img` with a label: to assistive technology this is one illustration of
      // the product, not a navigable interface full of dead controls.
      role="img"
      aria-label={`The OpenForge escrow view: three milestones totalling ${money(TOTAL)} ${TOKEN}, one released and ${money(HELD)} ${TOKEN} still held in the contract.`}
      className={cn(
        // Solid, not glass. This is a product interface, and a legible one
        // matters more than a pretty one — text over a live backdrop is the
        // first thing to become unreadable. It takes the lit rim and the deep
        // shadow so it still belongs to the same material family.
        'of-panel overflow-hidden rounded-2xl bg-surface text-left',
        'shadow-[var(--shadow-overlay)]',
        className,
      )}
    >
      {/* ------------------------------------------------------------ chrome */}
      <div className="flex h-11 items-center gap-3 border-b border-line bg-subtle px-4">
        <span className="hidden shrink-0 items-center gap-1.5 sm:flex" aria-hidden>
          {['bg-danger', 'bg-warning', 'bg-success'].map((tone) => (
            <span key={tone} className={cn('size-2.5 rounded-full opacity-50', tone)} />
          ))}
        </span>

        <div className="flex h-6 flex-1 items-center gap-2 rounded-md border border-line bg-surface px-2.5">
          <Search className="size-3 shrink-0 text-fg-muted" aria-hidden />
          <span className="truncate text-micro text-fg-muted">
            Search projects and escrows
          </span>
          <span className="ml-auto hidden rounded border border-line px-1 font-mono text-[9px] text-fg-muted sm:block">
            ⌘K
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="size-5 rounded-full bg-accent-subtle" aria-hidden />
          <span className="hidden font-mono text-micro text-fg-secondary sm:inline">
            0x8E13…799f
          </span>
          <ChevronDown className="size-3 text-fg-muted" aria-hidden />
        </div>
      </div>

      <div className="grid lg:grid-cols-[10.5rem_minmax(0,1fr)_13rem]">
        {/* ----------------------------------------------------- sidebar */}
        <nav className="hidden border-r border-line bg-subtle p-3 lg:block">
          <Logo className="ml-1.5 h-4 w-auto opacity-80" />

          {NAV.map((group) => (
            <div key={group.label} className="mt-5">
              <p className="px-1.5 pb-1.5 text-[9px] font-medium uppercase tracking-wider text-fg-muted">
                {group.label}
              </p>
              {group.items.map((item) => (
                <span
                  key={item.label}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-1.5 py-1.5 text-micro',
                    item.active ? 'bg-surface font-medium text-fg' : 'text-fg-secondary',
                  )}
                >
                  <item.icon
                    className={cn(
                      'size-3.5 shrink-0',
                      item.active ? 'text-accent' : 'text-fg-muted',
                    )}
                    aria-hidden
                  />
                  {item.label}
                </span>
              ))}
            </div>
          ))}
        </nav>

        {/* -------------------------------------------------------- main */}
        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-micro font-medium uppercase tracking-wide text-fg-muted">
                Escrow
              </p>
              <h3 className="mt-1 truncate text-section text-fg">Payments platform rebuild</h3>
              <p className="mt-1 font-mono text-micro text-fg-muted">
                {DEFAULT_CHAIN.contracts.escrowFactory.slice(0, 10)}…
                {DEFAULT_CHAIN.contracts.escrowFactory.slice(-4)}
              </p>
            </div>
            <Pill tone="accent">Funded</Pill>
          </div>

          {/* Figures as typography, matching how the real app renders a Stat
              row — unboxed, separated by a rule. */}
          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
            {[
              { label: 'Deposited', value: money(TOTAL) },
              { label: 'Released', value: money(RELEASED) },
              { label: 'Held', value: money(HELD) },
            ].map((stat) => (
              <div key={stat.label} className="min-w-0">
                <dt className="text-micro text-fg-muted">{stat.label}</dt>
                <dd className="mt-1 truncate font-mono text-body tabular-nums text-fg">
                  {stat.value}
                  <span className="ml-1 text-micro text-fg-muted">{TOKEN}</span>
                </dd>
              </div>
            ))}
          </dl>

          {/* The three-segment meter, exactly as the product renders it. */}
          <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-subtle">
            <span className="bg-success" style={{ width: `${(RELEASED / TOTAL) * 100}%` }} />
            <span className="bg-accent" style={{ width: `${(HELD / TOTAL) * 100}%` }} />
          </div>

          {/* ------------------------------------------------ milestones */}
          <ol className="mt-6">
            {MILESTONES.map((m) => (
              <li
                key={m.n}
                className="flex items-start gap-4 border-t border-line py-3.5 first:border-t-0"
              >
                <span className="w-5 shrink-0 pt-0.5 font-mono text-micro tabular-nums text-fg-muted">
                  {String(m.n).padStart(2, '0')}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-secondary',
                      m.status === 'released' ? 'text-fg-secondary' : 'text-fg',
                    )}
                  >
                    {m.title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Pill tone={m.status === 'released' ? 'success' : 'accent'}>
                      {m.status === 'released' ? 'Released' : 'Held in escrow'}
                    </Pill>
                    <span className="text-micro text-fg-muted">{m.when}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-mono text-secondary tabular-nums text-fg">
                    {money(m.amount)}
                    <span className="ml-1 text-micro text-fg-muted">{TOKEN}</span>
                  </p>
                  {m.status === 'held' && (
                    <p className="mt-0.5 text-micro text-fg-muted">
                      <span className="font-mono tabular-nums">
                        {money(m.amount - (m.amount * FEE_BPS) / 10_000)}
                      </span>{' '}
                      net
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* -------------------------------------------------------- rail */}
        <aside className="hidden border-l border-line bg-subtle p-5 lg:block">
          <p className="text-micro font-medium uppercase tracking-wide text-fg-muted">
            Last release
          </p>

          <dl className="mt-3.5 flex flex-col gap-2.5">
            {[
              ['Gross', money(RELEASED)],
              [`Fee (${feePercent(PROTOCOL.feeBasisPoints)})`, `−${money(RELEASED_FEE)}`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3">
                <dt className="text-micro text-fg-muted">{label}</dt>
                <dd className="font-mono text-micro tabular-nums text-fg-secondary">{value}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2.5">
              <dt className="text-micro text-fg">To developer</dt>
              <dd className="font-mono text-secondary tabular-nums text-fg">
                {money(RELEASED - RELEASED_FEE)}
              </dd>
            </div>
          </dl>

          <p className="mt-5 border-t border-line pt-4 text-micro leading-relaxed text-fg-muted">
            Released funds cannot be recalled. Every release is a public transaction on{' '}
            {DEFAULT_CHAIN.name}.
          </p>

          <div className="mt-4 flex flex-col gap-1.5">
            <span className="h-7 rounded-md bg-accent" />
            <span className="h-7 rounded-md border border-line bg-surface" />
          </div>
        </aside>
      </div>
    </div>
  );
}
