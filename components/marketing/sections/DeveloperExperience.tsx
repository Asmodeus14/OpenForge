import { cn } from '@/lib/cn';
import { Reveal } from '@/components/marketing/primitives/Reveal';
import { SectionHeading, MarketingSection } from '@/components/marketing/primitives/SectionHeading';
import { DEFAULT_CHAIN } from '@/chain/config';

/**
 * Code and terminal, side by side.
 *
 * The claim this section makes is that you do not have to use the interface at
 * all — so it shows the escrow being read straight from the chain with ethers,
 * and then verified against a block explorer. Both are things a reader can run.
 *
 * Syntax colouring is done with spans against the semantic tokens rather than a
 * highlighter library. A 40-line snippet does not justify shipping a parser,
 * and the token palette already carries a green, an amber and a violet that
 * belong to this product rather than to someone's editor theme.
 */

type Line = (string | [string, string])[];

const CODE: Line[] = [
  [['import', 'kw'], ' { Contract, JsonRpcProvider } ', ['from', 'kw'], [" 'ethers'", 'str']],
  [],
  [['const', 'kw'], ' provider = ', ['new', 'kw'], ' JsonRpcProvider(', ['RPC_URL', 'var'], ')'],
  [['const', 'kw'], ' escrow   = ', ['new', 'kw'], ' Contract(address, abi, provider)'],
  [],
  [['// Everything below is a public read. No key, no account.', 'com']],
  [['const', 'kw'], ' total    = ', ['await', 'kw'], ' escrow.totalAmount()'],
  [['const', 'kw'], ' released = ', ['await', 'kw'], ' escrow.releasedAmount()'],
  [['const', 'kw'], ' count    = ', ['await', 'kw'], ' escrow.milestoneCount()'],
  [],
  [['for', 'kw'], ' (', ['let', 'kw'], ' i = ', ['0', 'num'], '; i < count; i++) {'],
  ['  ', ['const', 'kw'], ' m = ', ['await', 'kw'], ' escrow.milestones(i)'],
  ['  console.log(m.amount, m.deadline, m.status)'],
  ['}'],
];

const CLASSES: Record<string, string> = {
  kw: 'text-accent-text',
  str: 'text-success-text',
  com: 'text-fg-muted',
  num: 'text-warning-text',
  var: 'text-info-text',
};

function Code() {
  return (
    <pre className="overflow-x-auto px-5 py-4 font-mono text-code leading-[1.7] text-fg-secondary">
      <code>
        {CODE.map((line, i) => (
          <span key={i} className="block whitespace-pre">
            {line.length === 0
              ? ' '
              : line.map((part, j) =>
                  typeof part === 'string' ? (
                    <span key={j}>{part}</span>
                  ) : (
                    <span key={j} className={CLASSES[part[1]]}>
                      {part[0]}
                    </span>
                  ),
                )}
          </span>
        ))}
      </code>
    </pre>
  );
}

const TERMINAL = [
  ['$ ', 'npx hardhat verify --network sepolia \\'],
  ['  ', `${DEFAULT_CHAIN.contracts.escrowFactory}`],
  ['', ''],
  ['', 'Successfully submitted source code for verification'],
  ['', 'Compiling 1 file with solc 0.8.24'],
  ['', ''],
  ['ok ', 'Contract verified on Etherscan'],
  ['', `${DEFAULT_CHAIN.explorer}/address/${DEFAULT_CHAIN.contracts.escrowFactory.slice(0, 12)}…#code`],
] as const;

export function DeveloperExperience() {
  return (
    <MarketingSection className="border-t border-line bg-subtle">
      <SectionHeading
        eyebrow="Developer experience"
        title="You never have to trust this interface."
        lede="Every figure on the site is a public read anyone can make. The frontend is a convenience, not an authority."
      />

      <div className="mt-16 grid gap-5 lg:mt-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Reveal y={16}>
          <div className="h-full overflow-hidden rounded-xl border border-line bg-canvas shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <span className="flex shrink-0 items-center gap-1.5" aria-hidden>
                {['bg-danger', 'bg-warning', 'bg-success'].map((tone) => (
                  <span key={tone} className={cn('size-2.5 rounded-full opacity-50', tone)} />
                ))}
              </span>
              <span className="ml-2 font-mono text-micro text-fg-muted">read-escrow.ts</span>
            </div>
            <Code />
          </div>
        </Reveal>

        <Reveal delay={100} y={16}>
          <div className="h-full overflow-hidden rounded-xl border border-line bg-canvas shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <span className="font-mono text-micro text-fg-muted">Terminal</span>
            </div>

            <pre className="overflow-x-auto px-5 py-4 font-mono text-code leading-[1.75]">
              <code>
                {TERMINAL.map(([prefix, text], i) => (
                  <span key={i} className="block whitespace-pre">
                    <span
                      className={
                        prefix === '$ '
                          ? 'text-accent-text'
                          : prefix === 'ok '
                            ? 'text-success-text'
                            : 'text-fg-muted'
                      }
                    >
                      {prefix === 'ok ' ? '✓ ' : prefix}
                    </span>
                    <span
                      className={
                        prefix === 'ok ' ? 'text-success-text' : 'text-fg-secondary'
                      }
                    >
                      {text || ' '}
                    </span>
                  </span>
                ))}
              </code>
            </pre>
          </div>
        </Reveal>
      </div>

      <Reveal delay={140}>
        <p className="mt-8 max-w-2xl text-secondary text-fg-muted">
          The ABI this site embeds is the one the factory deploys. If the two ever disagreed,
          the reads above would return something different from what the page shows — which
          is the point of being able to run them.
        </p>
      </Reveal>
    </MarketingSection>
  );
}
