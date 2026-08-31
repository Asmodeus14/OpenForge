import { ArrowUpRight, Scale, TerminalSquare, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GithubMark } from '@/components/ui/BrandIcons';
import { Reveal } from '@/components/marketing/primitives/Reveal';
import { SectionHeading, MarketingSection } from '@/components/marketing/primitives/SectionHeading';

/**
 * Open source, without the vanity metrics.
 *
 * No star count, no contributor avatars, no commit-activity graph. Every one of
 * those would have to be either fetched at build time — adding a network
 * dependency to a static page for decoration — or invented, and this page does
 * not invent numbers.
 *
 * What is left is what actually matters to someone deciding whether to trust
 * it: the licence, that the contracts are published, and that there is nothing
 * to sign up for.
 */

const POINTS = [
  {
    icon: Scale,
    title: 'MIT licensed',
    body: 'Fork it, run your own instance, or take the contracts and leave the interface behind.',
  },
  {
    icon: TerminalSquare,
    title: 'Contracts in the repository',
    body: 'The Solidity, the Hardhat config, the deployment script and 29 passing tests. The bytecode on Sepolia is built from it.',
  },
  {
    icon: Users,
    title: 'Nothing to sign up for',
    body: 'No account system, no telemetry, no server-side profile of you. The only identity is the wallet you connect.',
  },
];

export function OpenSource() {
  return (
    <MarketingSection className="border-t border-line">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-20">
        <SectionHeading
          className="lg:sticky lg:top-28"
          eyebrow="Open source"
          title="Readable, forkable, and not dependent on us existing."
          lede="A product that asks people to lock funds in a contract should be one they can read, run and leave."
        />

        <div>
          <ul className="flex flex-col">
            {POINTS.map((point, i) => (
              <Reveal as="li" key={point.title} delay={i * 70}>
                <div className="flex gap-5 border-t border-line py-7 first:border-t-0 first:pt-0">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl',
                      'border border-line bg-subtle text-fg-secondary',
                    )}
                  >
                    <point.icon className="size-4.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-section text-fg">{point.title}</h3>
                    <p className="mt-2 text-body text-fg-secondary">{point.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={220}>
            <a
              href="https://github.com/Asmodeus14/OpenForge"
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                'group mt-8 flex items-center gap-4 rounded-xl border border-line bg-surface p-5',
                'transition-[border-color,box-shadow] duration-[var(--dur-fast)]',
                'hover:border-line-strong hover:shadow-[var(--shadow-md)]',
              )}
            >
              <GithubMark className="size-6 shrink-0 text-fg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium text-fg">Asmodeus14/OpenForge</p>
                <p className="mt-0.5 truncate text-meta text-fg-muted">
                  Frontend, contracts and chat server
                </p>
              </div>
              <ArrowUpRight
                className="size-4 shrink-0 text-fg-muted transition-colors group-hover:text-fg"
                aria-hidden
              />
            </a>
          </Reveal>
        </div>
      </div>
    </MarketingSection>
  );
}
