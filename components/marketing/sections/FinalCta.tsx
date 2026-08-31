import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { GithubMark } from '@/components/ui/BrandIcons';
import { Environment } from '@/components/marketing/environment/Environment';
import { Reveal } from '@/components/marketing/primitives/Reveal';
import { DEFAULT_CHAIN } from '@/chain/config';

/**
 * The close.
 *
 * Returns to the environment the page opened in, so the whole thing reads as
 * one place rather than as a hero followed by documents. The sky is the same
 * component and the same phase — if the visitor arrived at dusk, they leave at
 * dusk.
 *
 * The last thing said is the limitation, not the invitation. Someone who
 * reaches the bottom of this page is close to connecting a wallet, and that is
 * the moment to be clearest that the tokens are worthless and the contracts are
 * unaudited — not the moment to stop mentioning it.
 */
export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden border-t border-line">
      <Environment className="-z-10" />

      <div className="mx-auto max-w-(--container-app) px-5 py-28 text-center sm:px-8 sm:py-36">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-balance text-display text-fg">
            Try the whole thing with money that is worth nothing.
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lead text-fg-secondary">
            Create a project, deploy an escrow, release a milestone, raise a dispute. Every
            path works end to end on {DEFAULT_CHAIN.label}, using tokens that come free from
            a faucet.
          </p>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/escrow/new"
              className={cn(
                buttonClasses({ variant: 'primary', size: 'lg' }),
                'rounded-full px-7',
              )}
            >
              Create an escrow
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="https://github.com/Asmodeus14/OpenForge"
              target="_blank"
              rel="noreferrer noopener"
              className={cn(buttonClasses({ size: 'lg' }), 'rounded-full px-7')}
            >
              <GithubMark className="size-4" />
              Read the source
            </a>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-10 max-w-lg text-balance text-meta text-fg-muted">
            OpenForge is an unaudited prototype on a test network. Tokens here have no
            monetary value. Do not connect a wallet holding real funds.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
