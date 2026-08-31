import { Reveal } from '@/components/marketing/primitives/Reveal';
import { SectionHeading, MarketingSection } from '@/components/marketing/primitives/SectionHeading';
import { DEFAULT_CHAIN } from '@/chain/config';
import { shortenAddress } from '@/lib/format';

/**
 * How the pieces actually fit together.
 *
 * A real diagram of a real system: the browser signs, the frontend reads and
 * writes, the factory deploys each escrow, the escrow holds the funds, and two
 * stores sit off to the side holding things that do not belong on chain.
 *
 * Drawn as one SVG so the edges can carry flow. Below `lg` it is replaced by a
 * plain list — a six-node diagram scaled to 380px is unreadable, and shrinking
 * it anyway is how technical diagrams end up as decoration.
 */

const NODES = [
  { x: 30, y: 60, w: 172, h: 76, title: 'Your wallet', sub: 'signs · holds keys' },
  { x: 292, y: 60, w: 204, h: 76, title: 'OpenForge', sub: 'reads · never custodies' },
  { x: 622, y: 18, w: 204, h: 72, title: 'EscrowFactory', sub: shortenAddress(DEFAULT_CHAIN.contracts.escrowFactory, 4) },
  { x: 622, y: 150, w: 204, h: 72, title: 'MilestoneEscrow', sub: 'holds the funds' },
  { x: 292, y: 208, w: 204, h: 64, title: 'IPFS', sub: 'milestone text' },
  { x: 292, y: 306, w: 204, h: 64, title: 'Chat server', sub: 'rooms · proposals' },
] as const;

/** `[d, label, labelX, labelY]` — every edge is a real call or deployment. */
const EDGES = [
  ['M 202 98 L 292 98', 'signs', 247, 88],
  ['M 496 92 C 560 92, 570 54, 622 54', 'createEscrow', 566, 60],
  ['M 496 104 C 560 104, 570 186, 622 186', 'release · reclaim', 560, 200],
  ['M 724 90 L 724 150', 'deploys', 762, 124],
  ['M 394 136 L 394 208', 'pins', 414, 176],
  ['M 394 272 L 394 306', '', 0, 0],
] as const;

export function Architecture() {
  return (
    <MarketingSection className="border-t border-line">
      <SectionHeading
        eyebrow="Architecture"
        title="Six pieces, and none of them is us holding your money."
        lede="The frontend can read everything and move nothing. Only the two wallets named in a contract can act on it."
      />

      {/* ------------------------------------------------------------ diagram */}
      <Reveal y={16} className="mt-16 hidden lg:block">
        <svg
          viewBox="0 0 1000 390"
          className="w-full"
          role="img"
          aria-label="Your wallet signs into the OpenForge frontend. The frontend calls createEscrow on the EscrowFactory, which deploys a MilestoneEscrow that holds the funds; the frontend also calls release and reclaim on that escrow. Separately it pins milestone text to IPFS and talks to the chat server for rooms and proposals."
        >
          <defs>
            <marker
              id="of-arrow"
              viewBox="0 0 10 10"
              refX={9}
              refY={5}
              markerWidth={5}
              markerHeight={5}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--line-strong)" />
            </marker>
          </defs>

          {EDGES.map(([d, label, lx, ly]) => (
            <g key={d}>
              <path
                d={d}
                fill="none"
                stroke="var(--line-strong)"
                strokeWidth={1.5}
                strokeDasharray="6 6"
                markerEnd="url(#of-arrow)"
                style={{ animation: 'of-flow 1.4s linear infinite' }}
              />
              {label && (
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  className="fill-fg-muted font-mono"
                  style={{ fontSize: 11 }}
                >
                  {label}
                </text>
              )}
            </g>
          ))}

          {NODES.map((n) => (
            <g key={n.title}>
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={12}
                className="fill-surface stroke-line"
                strokeWidth={1}
              />
              <text
                x={n.x + n.w / 2}
                y={n.y + n.h / 2 - 4}
                textAnchor="middle"
                className="fill-fg"
                style={{ fontSize: 15, fontWeight: 500 }}
              >
                {n.title}
              </text>
              <text
                x={n.x + n.w / 2}
                y={n.y + n.h / 2 + 16}
                textAnchor="middle"
                className="fill-fg-muted font-mono"
                style={{ fontSize: 11 }}
              >
                {n.sub}
              </text>
            </g>
          ))}
        </svg>
      </Reveal>

      {/* --------------------------------------------------------- fallback */}
      <ol className="mt-12 flex flex-col lg:hidden">
        {[
          ['Your wallet', 'Signs. Holds the keys. Nothing else can move your funds.'],
          ['OpenForge', 'Reads the chain and builds transactions for you to sign. It never custodies anything.'],
          ['EscrowFactory', 'Deploys every escrow from published source, and indexes it.'],
          ['MilestoneEscrow', 'One contract per agreement. This is what holds the money.'],
          ['IPFS', 'Milestone descriptions, pinned rather than stored on chain.'],
          ['Chat server', 'Rooms and signed proposals. It knows nothing about the chain.'],
        ].map(([title, body], i) => (
          <Reveal as="li" key={title} delay={i * 50} className="border-t border-line py-5">
            <p className="text-body font-medium text-fg">{title}</p>
            <p className="mt-1 text-secondary text-fg-secondary">{body}</p>
          </Reveal>
        ))}
      </ol>

      <Reveal delay={100}>
        <p className="mt-10 max-w-2xl text-secondary text-fg-muted">
          The chat server has no knowledge of on-chain state, and the contracts have no
          knowledge of the chat. That separation is deliberate: a room is a conversation, not
          a claim about who owns what.
        </p>
      </Reveal>
    </MarketingSection>
  );
}
