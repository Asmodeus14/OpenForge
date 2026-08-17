'use client';

import { useState } from 'react';
import { Compass, Plus, Search, Wallet } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge, StatusPill } from '@/components/ui/Badge';
import { Alert, EmptyState, ErrorState, Skeleton, SkeletonText } from '@/components/ui/States';
import { Card, Divider, Page, PageHeader, Section, Stat } from '@/components/ui/Layout';
import { Table } from '@/components/ui/Table';
import { Avatar, AvatarGroup } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { TransactionFlow } from '@/components/trust/TransactionFlow';
import {
  AddressDisplay,
  DisclosureNote,
  FactList,
  NetworkBadge,
  TechnicalDetails,
  TokenAmount,
  TxHashDisplay,
} from '@/components/trust/Trust';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useTransaction } from '@/hooks/useTransaction';
import { escrowState, milestoneStatus, projectStatus, EscrowState, ProjectStatus } from '@/lib/status';
import { DEFAULT_CHAIN, calculateFee, calculateNetAmount } from '@/chain/config';
import { formatTokenAmount } from '@/lib/format';

/**
 * Design system reference.
 *
 * A single page showing every primitive in every state, in both themes, so
 * the visual language can be judged and kept consistent as pages are built.
 * Not linked from the product navigation.
 */

const TOKEN = DEFAULT_CHAIN.tokens[0];
const AMOUNT = 1200n * 10n ** BigInt(TOKEN.decimals);
const ADDRESS = '0x8E1371C3b2Cc6E0Cd4C1e5aC7d6F9b2A3c4D5e6F';
const HASH = '0x8f3a91c2b4d6e8f0a2c4e6081a3c5e7092b4d6f8a0c2e4681b3d5f709a1c3e5b7';

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-14 rounded-md border border-line ${className}`} />
      <span className="font-mono text-micro text-fg-muted">{name}</span>
    </div>
  );
}

export default function DesignPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [text, setText] = useState('');

  const tx = useTransaction();

  const fee = calculateFee(AMOUNT);
  const net = calculateNetAmount(AMOUNT);

  const demoIntent = {
    title: 'Release milestone 2',
    actionLabel: `Release ${formatTokenAmount(net, TOKEN.decimals)} ${TOKEN.symbol}`,
    irreversible: true,
    facts: [
      { label: 'Milestone', value: 'Authentication V2' },
      { label: 'Recipient', value: <AddressDisplay address={ADDRESS} showExplorer={false} /> },
      { label: 'Milestone amount', value: <TokenAmount amount={AMOUNT} token={TOKEN} /> },
      { label: 'Platform fee (1.5%)', value: <TokenAmount amount={fee} token={TOKEN} /> },
      {
        label: 'Developer receives',
        value: <TokenAmount amount={net} token={TOKEN} size="prominent" />,
        emphasis: true,
      },
      { label: 'Network', value: DEFAULT_CHAIN.label },
    ],
    disclosures: [
      'A 1.5% platform fee is deducted on release and sent to a fixed address. No fee is charged on disputes or cancellations.',
      'Releasing a milestone is final. The funds cannot be recalled once the transaction confirms.',
    ],
    failureReassurance: 'Your funds have NOT been released.',
    successSummary: `${formatTokenAmount(net, TOKEN.decimals)} ${TOKEN.symbol} was sent to the developer.`,
    steps: [
      {
        label: `Release ${formatTokenAmount(net, TOKEN.decimals)} ${TOKEN.symbol}`,
        kind: 'send' as const,
        description: 'Transfers the milestone reward and pays the platform fee.',
        run: async () => {
          await new Promise((r) => setTimeout(r, 1200));
          throw new Error('user rejected action');
        },
      },
    ],
  };

  return (
    <Page width="app" className="pb-32">
      <PageHeader
        eyebrow="Reference"
        title="Design system"
        description="Every primitive, in every state. Use this to keep the product visually coherent as pages are built."
        actions={<ThemeToggle />}
      />

      <Section title="Colour" description="Surfaces, text and semantic tones. Both themes." divided={false}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <Swatch name="canvas" className="bg-canvas" />
          <Swatch name="subtle" className="bg-subtle" />
          <Swatch name="surface" className="bg-surface" />
          <Swatch name="elevated" className="bg-elevated" />
          <Swatch name="accent" className="bg-accent" />
          <Swatch name="accent-subtle" className="bg-accent-subtle" />
          <Swatch name="success" className="bg-success" />
          <Swatch name="warning" className="bg-warning" />
          <Swatch name="danger" className="bg-danger" />
          <Swatch name="info" className="bg-info" />
          <Swatch name="fg" className="bg-fg" />
          <Swatch name="fg-muted" className="bg-fg-muted" />
        </div>
      </Section>

      <Section title="Typography" description="A strict scale. A size not on this list is a bug.">
        <div className="flex flex-col gap-5">
          <p className="text-hero">Build together</p>
          <p className="text-display">Own what you build</p>
          <p className="text-title">Page title</p>
          <p className="text-heading">Heading</p>
          <p className="text-section">Section</p>
          <p className="text-lead text-fg-secondary">
            Lead paragraph, 17px, used for marketing body copy where reading comfort matters more
            than density.
          </p>
          <p className="text-body">
            Body, 15px. The default for application text — dense enough for a developer tool,
            comfortable enough to read for an hour.
          </p>
          <p className="text-secondary text-fg-secondary">Secondary, 14px.</p>
          <p className="text-meta text-fg-muted">Metadata, 13px.</p>
          <p className="text-micro uppercase tracking-wide text-fg-muted">Micro label, 11px</p>
          <p className="font-mono text-code">
            Mono 13px — 0x8f3a…e5b7 · 1,182.00 tUSDC · block #7,412,908
          </p>
        </div>
      </Section>

      <Section title="Buttons" description="Every variant, size and state.">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Create project</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Release funds</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" loading>
              Submitting
            </Button>
            <Button disabled>Disabled</Button>
            <Button leadingIcon={<Plus className="size-4" aria-hidden />}>With icon</Button>
            <IconButton label="Search" icon={<Search className="size-4" aria-hidden />} />
            <IconButton
              label="Wallet"
              variant="secondary"
              icon={<Wallet className="size-4" aria-hidden />}
            />
          </div>
        </div>
      </Section>

      <Section title="Inputs" description="Labels are always visible; placeholders never carry meaning alone.">
        <div className="grid gap-6 sm:grid-cols-2">
          <Input label="Project name" placeholder="Authentication service" />
          <Input
            label="Wallet address"
            mono
            placeholder="0x…"
            leadingIcon={<Wallet className="size-4" aria-hidden />}
            hint="The address that will receive milestone payments."
          />
          <Input label="Amount" defaultValue="not-a-number" error="Enter an amount greater than zero." />
          <Input label="Disabled" placeholder="Unavailable" disabled />
          <Textarea
            label="Description"
            placeholder="What is this project for?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={280}
            showCount
            containerClassName="sm:col-span-2"
          />
        </div>
      </Section>

      <Section title="Status" description="Colour is never the only signal — every status carries an icon and a word.">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {[ProjectStatus.Draft, ProjectStatus.Funding, ProjectStatus.Completed, ProjectStatus.Failed].map(
              (s) => (
                <StatusPill key={s} status={projectStatus(s)} />
              ),
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              EscrowState.Created,
              EscrowState.Funded,
              EscrowState.Completed,
              EscrowState.Cancelled,
              EscrowState.Disputed,
            ].map((s) => (
              <StatusPill key={s} status={escrowState(s)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill status={milestoneStatus({ released: true, cancelled: false, deadline: 0n })} />
            <StatusPill status={milestoneStatus({ released: false, cancelled: false, deadline: 0n })} />
            <StatusPill status={milestoneStatus({ released: false, cancelled: true, deadline: 0n })} />
            <StatusPill status={milestoneStatus({ released: false, cancelled: false, deadline: 1n })} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="accent">Accent</Badge>
            <NetworkBadge />
            <NetworkBadge chainId={1} />
          </div>
        </div>
      </Section>

      <Section title="Trust" description="Identity, money and network render the same way everywhere.">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <AddressDisplay address={ADDRESS} name="Alex Chen" />
            <TxHashDisplay hash={HASH} />
            <div className="flex items-baseline gap-6">
              <TokenAmount amount={AMOUNT} token={TOKEN} />
              <TokenAmount amount={net} token={TOKEN} size="prominent" />
            </div>
            <div className="flex items-center gap-3">
              <Avatar address={ADDRESS} name="Alex Chen" size="lg" />
              <AvatarGroup
                people={[
                  { address: ADDRESS, name: 'Alex Chen' },
                  { address: '0xAb', name: 'Maria Singh' },
                  { address: '0xCd', name: 'Jon Park' },
                  { address: '0xEf' },
                  { address: '0x01' },
                ]}
              />
            </div>
            <DisclosureNote>
              A 1.5% platform fee is deducted on release. No fee is charged on disputes.
            </DisclosureNote>
            <DisclosureNote tone="caution">
              The funder can resolve a dispute immediately. You must wait 30 days.
            </DisclosureNote>
          </div>

          <div className="flex flex-col gap-5">
            <Card className="px-4">
              <FactList
                facts={[
                  { label: 'Milestone', value: 'Authentication V2' },
                  { label: 'Recipient', value: <AddressDisplay address={ADDRESS} showExplorer={false} /> },
                  { label: 'Fee (1.5%)', value: <TokenAmount amount={fee} token={TOKEN} /> },
                  {
                    label: 'Developer receives',
                    value: <TokenAmount amount={net} token={TOKEN} size="prominent" />,
                    emphasis: true,
                  },
                ]}
              />
            </Card>
            <TechnicalDetails>
              <FactList
                facts={[
                  { label: 'Network', value: DEFAULT_CHAIN.label },
                  { label: 'Escrow contract', value: <AddressDisplay address={ADDRESS} chars={6} /> },
                  { label: 'Transaction', value: <TxHashDisplay hash={HASH} /> },
                ]}
              />
            </TechnicalDetails>
          </div>
        </div>
      </Section>

      <Section title="Statistics" description="Typography and whitespace, not a row of boxes.">
        <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <Stat label="Active projects" value="12" />
          <Stat label="Contributions" value="48" detail="Across 6 projects" />
          <Stat label="In escrow" value={<TokenAmount amount={AMOUNT} token={TOKEN} />} />
          <Stat label="Milestones" value="31" detail="12 of 14 complete" />
        </dl>
      </Section>

      <Section title="Table" description="Developer data reads better as a table than as cards.">
        <Table
          caption="Example milestones"
          getRowKey={(r) => r.name}
          rows={[
            { name: 'OAuth integration', status: 'released', amount: 400n * 10n ** 6n },
            { name: 'Wallet authentication', status: 'released', amount: 300n * 10n ** 6n },
            { name: 'Session management', status: 'pending', amount: 300n * 10n ** 6n },
            { name: 'Security audit', status: 'overdue', amount: 200n * 10n ** 6n },
          ]}
          columns={[
            { key: 'name', header: 'Milestone', render: (r) => <span className="text-fg">{r.name}</span> },
            {
              key: 'status',
              header: 'Status',
              hideOnMobile: true,
              render: (r) => (
                <StatusPill
                  status={milestoneStatus({
                    released: r.status === 'released',
                    cancelled: false,
                    deadline: r.status === 'overdue' ? 1n : 0n,
                  })}
                />
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              render: (r) => <TokenAmount amount={r.amount} token={TOKEN} />,
            },
          ]}
        />
      </Section>

      <Section title="Tabs">
        <Tabs
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'overview', label: 'Overview', content: <p className="text-body text-fg-secondary">Overview content.</p> },
            { value: 'milestones', label: 'Milestones', count: 4, content: <p className="text-body text-fg-secondary">Milestones content.</p> },
            { value: 'activity', label: 'Activity', content: <p className="text-body text-fg-secondary">Activity content.</p> },
          ]}
        />
      </Section>

      <Section title="Feedback" description="Loading, empty and error — designed, not afterthoughts.">
        <div className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <Skeleton className="h-5 w-32" />
              <SkeletonText lines={3} className="mt-4" />
            </Card>
            <Card className="p-4">
              <Skeleton className="h-5 w-24" />
              <SkeletonText lines={3} className="mt-4" />
            </Card>
            <Card className="p-4">
              <Skeleton className="h-5 w-28" />
              <SkeletonText lines={3} className="mt-4" />
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <Alert tone="info" title="No profile yet">
              Other contributors see only your wallet address until you create a profile.
            </Alert>
            <Alert tone="warning" title="Wrong network">
              OpenForge is deployed on {DEFAULT_CHAIN.label} only.
            </Alert>
            <Alert tone="success" title="Escrow funded">
              Funds are held by the escrow contract and released per milestone.
            </Alert>
          </div>

          <ErrorState
            context="Milestone was not released"
            error={{ code: 'CALL_EXCEPTION', message: 'execution reverted: NotFunder' }}
            onRetry={() => {}}
          />

          <Card>
            <EmptyState
              icon={<Compass className="size-5" aria-hidden />}
              title="No projects yet"
              description="Nothing has been registered on the project registry on this network. The first project published will appear here."
              action={<Button variant="primary">Create the first project</Button>}
            />
          </Card>
        </div>
      </Section>

      <Section title="Overlays" description="Focus-trapped, Escape-dismissible, restore focus on close.">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Delete room
          </Button>
          <Button variant="primary" onClick={() => tx.start(demoIntent)}>
            Release {formatTokenAmount(net, TOKEN.decimals)} {TOKEN.symbol}
          </Button>
        </div>
        <p className="mt-3 text-meta text-fg-muted">
          The release flow above deliberately fails, to show the honest failure state.
        </p>
      </Section>

      <Divider />

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Dialog"
        description="Radix supplies focus trapping and ARIA; the design system supplies the look."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setDialogOpen(false)}>
              Save changes
            </Button>
          </>
        }
      >
        <p className="text-body text-fg-secondary">
          Dialog body content sits here, scrolling independently if it grows.
        </p>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this room?"
        description="The room and its message history will no longer be reachable. This cannot be undone."
        confirmLabel="Delete room"
        destructive
        onConfirm={() => setConfirmOpen(false)}
      />

      <TransactionFlow tx={tx} />
    </Page>
  );
}
