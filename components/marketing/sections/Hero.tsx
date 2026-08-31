import Link from 'next/link';
import { ArrowRight, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { GithubMark } from '@/components/ui/BrandIcons';
import { Environment } from '@/components/marketing/environment/Environment';
import { DashboardMock } from '@/components/marketing/product/DashboardMock';
import { Reveal } from '@/components/marketing/primitives/Reveal';
import { DEFAULT_CHAIN } from '@/chain/config';

/**
 * The hero.
 *
 * Composed as depth rather than as a stack of blocks: sky, then atmospheric
 * wash, then type, then the product sitting in front of all of it and cropping
 * the bottom of the frame. The dashboard is deliberately allowed to run past
 * the fold — a product shot with air underneath it reads as a picture of a
 * product, and one that continues past the edge reads as a window into it.
 *
 * The claims in the row at the bottom are the four that are actually true and
 * checkable. "Self hosted" and "no vendor lock-in" were in the brief but are
 * not things this project does, and the landing page has a standing rule
 * against saying otherwise.
 */

const CLAIMS = ['Open source', 'Non-custodial', 'No accounts', 'Verifiable on chain'];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <Environment className="-z-10 h-[132%]" />

      <div className="mx-auto max-w-(--container-wide) px-5 pt-14 sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="of-glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-micro font-medium text-fg-secondary">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              Open source · Live on {DEFAULT_CHAIN.label}
            </span>
          </Reveal>

          {/* One <h1>, two authored lines. The gradient carries the whole
              second line rather than just the product name — at this size a
              gradient on one word reads as a highlighter, on a full line it
              reads as identity. */}
          <Reveal delay={60}>
            <h1 className="mt-7 text-balance text-hero text-fg">
              Agree it. Fund it.
              <br />
              <span className="bg-gradient-to-r from-info via-accent to-accent-hover bg-clip-text text-transparent">
                Ship it with OpenForge.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-7 max-w-xl text-balance text-lead text-fg-secondary">
              Milestone escrow for open source work. The money goes into a contract before
              the work starts, and releases one milestone at a time — only for work that was
              actually delivered.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/overview"
                className={cn(
                  buttonClasses({ variant: 'primary', size: 'lg' }),
                  'rounded-full px-7',
                )}
              >
                Get started
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href="https://github.com/Asmodeus14/OpenForge"
                target="_blank"
                rel="noreferrer noopener"
                className={cn(buttonClasses({ size: 'lg' }), 'rounded-full px-7')}
              >
                <GithubMark className="size-4" />
                Star on GitHub
              </a>
            </div>
          </Reveal>

          {/* Above the product, inline, as corroboration of the sentence just
              read. Four short true claims — not the four in the brief, two of
              which this project cannot make. */}
          <Reveal delay={240}>
            <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
              {CLAIMS.map((claim) => (
                <li
                  key={claim}
                  className="inline-flex items-center gap-1.5 text-meta text-fg-secondary"
                >
                  <CircleCheck className="size-3.5 shrink-0 text-accent-text" aria-hidden />
                  {claim}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* --------------------------------------------------------- product */}
        <Reveal delay={300} y={20} className="mx-auto mt-14 max-w-(--container-app) sm:mt-18">
          <DashboardMock />
        </Reveal>
      </div>
    </section>
  );
}
