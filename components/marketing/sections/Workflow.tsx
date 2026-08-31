import { Banknote, FileSignature, MessagesSquare, PenTool, Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Reveal } from '@/components/marketing/primitives/Reveal';
import { SectionHeading, MarketingSection } from '@/components/marketing/primitives/SectionHeading';
import { DEFAULT_CHAIN, PROTOCOL } from '@/chain/config';
import { feePercent } from '@/lib/format';

/**
 * From agreement to payment.
 *
 * The five steps an escrow actually passes through, in order, with what each
 * one costs. This is the section the brief called "Code → Build → Test →
 * Deploy → Monitor"; the shape is the same and the content is this product's.
 *
 * The cost line under each step is the point of the whole section. The number
 * of wallet prompts is the thing people are most surprised by in an on-chain
 * flow, and stating it five times on the marketing page means it is never a
 * surprise in the product.
 */

const STEPS = [
  {
    icon: MessagesSquare,
    title: 'Propose',
    body: 'The funder writes the milestones, amounts and deadlines into a conversation. Nothing is on chain yet, and everything is still editable.',
    cost: 'No gas',
  },
  {
    icon: FileSignature,
    title: 'Sign',
    body: 'The developer signs those exact terms. The signature covers the amounts and the deadlines, so neither side can quietly change them afterwards.',
    cost: 'Signature · no gas',
  },
  {
    icon: Banknote,
    title: 'Fund',
    body: 'The contract is deployed and the whole amount is deposited at once. The developer can see the money is there before starting.',
    cost: '2 transactions',
  },
  {
    icon: PenTool,
    title: 'Deliver',
    body: 'Work happens where work happens. The contract holds the funds and takes no view on it — nothing on chain can judge whether a milestone was met.',
    cost: 'Off chain',
  },
  {
    icon: Send,
    title: 'Release',
    body: `The funder releases a milestone and the developer is paid immediately, minus a ${feePercent(PROTOCOL.feeBasisPoints)} fee. Nothing is charged at any other point.`,
    cost: '1 transaction',
  },
];

export function Workflow() {
  return (
    <MarketingSection className="border-t border-line bg-subtle">
      <SectionHeading
        eyebrow="From agreement to payment"
        title="Five steps, and you are told the cost of every one."
        lede="Escrow shifts risk rather than removing it. Knowing exactly where the money is at each stage is most of what makes that trade worth taking."
      />

      <ol className="mt-16 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:mt-20 lg:grid-cols-5">
        {STEPS.map((step, index) => (
          <Reveal
            as="li"
            key={step.title}
            delay={index * 60}
            className="flex flex-col bg-canvas p-6"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                  'border border-accent-line bg-accent-subtle text-accent-text',
                )}
              >
                <step.icon className="size-4" aria-hidden />
              </span>
              <span className="font-mono text-micro tabular-nums text-fg-muted">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>

            <h3 className="mt-5 text-section text-fg">{step.title}</h3>
            <p className="mt-2.5 flex-1 text-secondary text-fg-secondary">{step.body}</p>

            <p className="mt-5 border-t border-line pt-3 font-mono text-micro text-fg-muted">
              {step.cost}
            </p>
          </Reveal>
        ))}
      </ol>

      <Reveal delay={120}>
        <p className="mt-8 max-w-2xl text-secondary text-fg-muted">
          Two transactions rather than four: the factory deploys and registers the escrow in
          one, and an EIP-2612 token folds the approval into the deposit as a free
          signature. Every prompt is named before the first one opens. All of it runs on{' '}
          {DEFAULT_CHAIN.label}.
        </p>
      </Reveal>
    </MarketingSection>
  );
}
