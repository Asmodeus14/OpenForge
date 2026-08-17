'use client';

import Link from 'next/link';
import { ArrowRight, Compass, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { Card, Divider, Page, PageHeader, Section, Stat } from '@/components/ui/Layout';
import { EmptyState, ErrorState, Skeleton, Alert } from '@/components/ui/States';
import { StatusPill } from '@/components/ui/Badge';
import { AddressDisplay, DisclosureNote } from '@/components/trust/Trust';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import { useEscrowProjects, useProfile, useProjectsByBuilder } from '@/hooks/queries';
import { projectStatus } from '@/lib/status';
import { DEFAULT_CHAIN } from '@/chain/config';

/** Time-of-day greeting. Small, but it makes the page feel addressed to you. */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Overview.
 *
 * Shows only figures derived from real on-chain reads. There is no activity
 * feed, contribution graph or reputation score, because none of those exist
 * in the deployed contracts or the backend — inventing them would be the
 * fastest way to make the rest of the numbers untrustworthy too.
 */
export function OverviewClient() {
  const wallet = useWalletContext();
  const profile = useProfile(wallet.account);
  const projects = useProjectsByBuilder(wallet.account);
  const escrows = useEscrowProjects(wallet.account);

  /* ---------------------------------------------------------- no wallet */

  if (!wallet.account) {
    return (
      <Page>
        <PageHeader
          title="Overview"
          description="Your projects, escrows and profile in one place."
        />
        <Divider />
        <EmptyState
          icon={<Wallet className="size-5" aria-hidden />}
          title="Connect a wallet to see your workspace"
          description={`Your work is identified by your wallet address. Connecting only reads public data — it does not move funds and does not ask for a signature. OpenForge runs on ${DEFAULT_CHAIN.label}.`}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="primary"
                onClick={wallet.connect}
                loading={wallet.isConnecting}
                leadingIcon={<Wallet className="size-4" aria-hidden />}
              >
                Connect wallet
              </Button>
              <Link href="/discover" className={buttonClasses({ variant: 'secondary' })}>
                Browse projects instead
              </Link>
            </div>
          }
        />
        {wallet.error && (
          <ErrorState
            className="mt-2"
            compact
            context={wallet.error.title}
            error={wallet.error.raw ?? wallet.error.message}
          />
        )}
      </Page>
    );
  }

  /* ------------------------------------------------------------ connected */

  const loading = projects.isPending || escrows.isPending;
  const empty =
    !loading && (projects.data?.length ?? 0) === 0 && (escrows.data?.length ?? 0) === 0;

  return (
    <Page>
      <PageHeader
        title={`${greeting()}.`}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Signed in as
            <AddressDisplay address={wallet.account} showExplorer={false} />
          </span>
        }
        actions={
          <Link href="/projects/new" className={buttonClasses({ variant: 'primary' })}>
            <Plus className="size-4" aria-hidden />
            New project
          </Link>
        }
      />

      {wallet.wrongNetwork && (
        <Alert tone="warning" title="Wrong network" className="mb-8">
          Your wallet is connected to a different network. OpenForge is deployed on{' '}
          {DEFAULT_CHAIN.label} only.{' '}
          <button
            type="button"
            onClick={wallet.switchNetwork}
            className="font-medium underline underline-offset-4"
          >
            Switch network
          </button>
        </Alert>
      )}

      {/* Figures as typography, separated by rules — not six bordered cards. */}
      <dl className="grid grid-cols-2 gap-8 border-t border-line py-8 sm:grid-cols-4">
        <Stat
          label="Projects"
          value={
            projects.isPending ? <Skeleton className="h-7 w-10" /> : (projects.data?.length ?? 0)
          }
        />
        <Stat
          label="Escrows"
          value={
            escrows.isPending ? <Skeleton className="h-7 w-10" /> : (escrows.data?.length ?? 0)
          }
        />
        <Stat
          label="Profile"
          value={
            profile.isPending ? (
              <Skeleton className="h-7 w-24" />
            ) : profile.data ? (
              'Published'
            ) : (
              'Not created'
            )
          }
        />
        <Stat label="Network" value={DEFAULT_CHAIN.name} detail="Test funds only" />
      </dl>

      {!profile.isPending && !profile.data && (
        <Alert tone="info" title="No profile yet">
          Other contributors see only your wallet address until you create a profile.{' '}
          <Link href="/profile" className="font-medium underline underline-offset-4">
            Create one
          </Link>
          .
        </Alert>
      )}

      {empty ? (
        <Section divided>
          <EmptyState
            icon={<Compass className="size-5" aria-hidden />}
            title="Nothing here yet"
            description="You have no projects or escrows on this network. Create a project to describe what you are building, or deploy an escrow to fund milestone work."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/projects/new" className={buttonClasses({ variant: 'primary' })}>
                  Create a project
                </Link>
                <Link href="/discover" className={buttonClasses({ variant: 'secondary' })}>
                  Browse projects
                </Link>
              </div>
            }
          />
        </Section>
      ) : (
        <Section
          title="Your projects"
          actions={
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-meta text-fg-secondary transition-colors hover:text-fg"
            >
              View all
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        >
          {projects.isError ? (
            <ErrorState
              error={projects.error}
              context="Your projects could not be loaded"
              onRetry={() => void projects.refetch()}
            />
          ) : projects.isPending ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : projects.data.length === 0 ? (
            <p className="py-6 text-body text-fg-secondary">
              You have no projects yet.{' '}
              <Link href="/projects/new" className="text-accent-text underline underline-offset-4">
                Create one
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {projects.data.slice(0, 5).map((project) => (
                <li key={project.projectId}>
                  <Card interactive>
                    <Link
                      href={`/projects/${project.projectId}`}
                      className="flex items-center justify-between gap-4 px-4 py-3.5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-body text-fg">
                          Project #{project.projectId}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-micro text-fg-muted">
                          {project.metadataCid}
                        </span>
                      </span>
                      <StatusPill status={projectStatus(project.status)} />
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section divided className="pb-16">
        <DisclosureNote>
          OpenForge runs on {DEFAULT_CHAIN.label}. Any balance or payment shown in this app
          is a test value and has no real-world worth.
        </DisclosureNote>
      </Section>
    </Page>
  );
}
