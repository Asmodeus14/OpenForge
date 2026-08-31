import type { Metadata } from 'next';
import { MarketingFooter } from '@/components/marketing/MarketingChrome';
import { RevealNoScript } from '@/components/marketing/primitives/Reveal';
import { MarketingNav } from '@/components/marketing/sections/MarketingNav';
import { Hero } from '@/components/marketing/sections/Hero';
import { Showcase } from '@/components/marketing/sections/Showcase';
import { Workflow } from '@/components/marketing/sections/Workflow';
import { Guarantees } from '@/components/marketing/sections/Guarantees';
import { Bento } from '@/components/marketing/sections/Bento';
import { Architecture } from '@/components/marketing/sections/Architecture';
import { DeveloperExperience } from '@/components/marketing/sections/DeveloperExperience';
import { OpenSource } from '@/components/marketing/sections/OpenSource';
import { FinalCta } from '@/components/marketing/sections/FinalCta';

/**
 * The landing page.
 *
 * Every claim here is checkable. There are no visitor counts, no funding
 * totals, no success rates, no invented testimonials and no logos of companies
 * that have never heard of this project. The figures in the product mock are
 * arithmetically real — the milestones sum to the total and the fee is the
 * protocol constant applied to it — and the contract addresses are the deployed
 * ones. For a product asking people to lock money in a contract, that is the
 * only kind of persuasion worth having.
 *
 * The order is a descent from atmosphere to evidence: the world and the
 * product, then the single moment that matters, then the mechanism, then the
 * limits, then the parts, then the wiring, then the code. Someone who stops
 * reading at any point has still been told the truth up to there.
 */

export const metadata: Metadata = {
  title: 'OpenForge — milestone escrow for open source work',
  description:
    'Fund open source work through a contract that releases payment milestone by milestone. A prototype on the Sepolia test network.',
};

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <RevealNoScript />
      {/* The nav floats over the environment, so it is a sibling of the hero
          rather than a bar above it. */}
      <MarketingNav />

      <main id="main" className="-mt-[4.5rem] flex-1">
        <Hero />
        <Showcase />
        <Workflow />
        <Guarantees />
        <Bento />
        <Architecture />
        <DeveloperExperience />
        <OpenSource />
        <FinalCta />
      </main>

      <MarketingFooter />
    </div>
  );
}
