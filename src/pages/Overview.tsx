import { Link } from 'react-router-dom';
import { ArrowRight, Compass, FolderGit2, Plus, UserRound, Wallet } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusPill,
} from '../design/primitives';
import { AddressDisplay, DisclosureNote } from '../design/primitives/Trust';
import { PageHeader } from '../app/PageHeader';
import { useWalletContext } from '../app/WalletProvider';
import { useEscrowProjects, useProfile, useProjectsByBuilder } from '../hooks/queries';
import { projectStatus } from '../lib/status';
import { DEFAULT_CHAIN } from '../chain/config';

/**
 * A single figure with a label.
 *
 * Deliberately not a card. Six bordered boxes in a row is dashboard clutter;
 * typography and a divider carry the same information more quietly (§16).
 */
function Stat({
  label,
  value,
  loading,
  href,
}: {
  label: string;
  value: string | number;
  loading?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <dt className="text-meta text-fg-muted">{label}</dt>
      <dd className="mt-1 text-title tabular-nums text-fg">
        {loading ? <Skeleton className="h-7 w-12" /> : value}
      </dd>
    </>
  );

  return href ? (
    <Link
      to={href}
      className="rounded-md px-1 transition-colors duration-[var(--dur-hover)] hover:bg-raised"
    >
      {body}
    </Link>
  ) : (
    <div className="px-1">{body}</div>
  );
}

/**
 * Overview — what this wallet actually has in the system.
 *
 * Shows only figures derived from real on-chain reads. There is no activity
 * feed, contribution graph or reputation score here, because none of those
 * exist in the deployed contracts or the backend.
 */
export default function OverviewPage() {
  const wallet = useWalletContext();
  const profile = useProfile(wallet.account);
  const projects = useProjectsByBuilder(wallet.account);
  const escrows = useEscrowProjects(wallet.account);

  if (!wallet.account) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <PageHeader
          title="Overview"
          description="Your projects, escrows and profile in one place."
        />
        <EmptyState
          className="mt-8"
          icon={<Wallet className="size-5" aria-hidden />}
          title="Connect a wallet to see your workspace"
          description={`Your projects and escrows are identified by your wallet address. Connecting only reads public data — it does not move funds or require a signature. This app runs on ${DEFAULT_CHAIN.label}.`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="primary"
                onClick={wallet.connect}
                loading={wallet.isConnecting}
                leadingIcon={<Wallet className="size-4" aria-hidden />}
              >
                Connect wallet
              </Button>
              <Button variant="secondary" onClick={() => window.location.assign('/discover')}>
                Browse projects instead
              </Button>
            </div>
          }
        />
        {wallet.error && (
          <ErrorState
            className="mt-4"
            error={wallet.error.raw ?? wallet.error.message}
            context={wallet.error.title}
            compact
          />
        )}
      </div>
    );
  }

  const isLoading = projects.isPending || escrows.isPending;
  const hasNothing =
    !isLoading &&
    (projects.data?.length ?? 0) === 0 &&
    (escrows.data?.length ?? 0) === 0 &&
    !profile.data;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <PageHeader
        title="Overview"
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            Signed in as
            <AddressDisplay address={wallet.account} showExplorer={false} />
          </span>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            leadingIcon={<Plus className="size-4" aria-hidden />}
            onClick={() => window.location.assign('/projects/new')}
          >
            New project
          </Button>
        }
      />

      {wallet.wrongNetwork && (
        <Alert tone="warning" title="Wrong network">
          Your wallet is connected to a different network. OpenForge is deployed on{' '}
          {DEFAULT_CHAIN.label} only.{' '}
          <button
            type="button"
            onClick={wallet.switchNetwork}
            className="underline underline-offset-4"
          >
            Switch network
          </button>
        </Alert>
      )}

      {!profile.isPending && !profile.data && (
        <Alert tone="info" title="No profile yet">
          Other contributors see only your wallet address until you create a profile.{' '}
          <Link to="/profile" className="underline underline-offset-4">
            Create one
          </Link>
          .
        </Alert>
      )}

      <dl className="grid grid-cols-2 gap-6 border-y border-line py-5 sm:grid-cols-3">
        <Stat
          label="Projects"
          value={projects.data?.length ?? 0}
          loading={projects.isPending}
          href="/projects"
        />
        <Stat
          label="Escrows"
          value={escrows.data?.length ?? 0}
          loading={escrows.isPending}
          href="/escrow"
        />
        <Stat
          label="Profile"
          value={profile.data ? 'Published' : 'Not created'}
          loading={profile.isPending}
          href="/profile"
        />
      </dl>

      {hasNothing ? (
        <EmptyState
          icon={<Compass className="size-5" aria-hidden />}
          title="Nothing here yet"
          description="You have no projects or escrows on this network. Create a project to describe what you are building, or deploy an escrow to fund milestone work."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="primary" onClick={() => window.location.assign('/projects/new')}>
                Create a project
              </Button>
              <Button variant="secondary" onClick={() => window.location.assign('/discover')}>
                Browse projects
              </Button>
            </div>
          }
        />
      ) : (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-section text-fg">Your projects</h2>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-meta text-accent-text hover:underline underline-offset-4"
            >
              View all
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>

          {projects.isError ? (
            <ErrorState
              error={projects.error}
              context="Your projects could not be loaded"
              onRetry={() => void projects.refetch()}
            />
          ) : projects.isPending ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : projects.data.length === 0 ? (
            <EmptyState
              icon={<FolderGit2 className="size-5" aria-hidden />}
              title="No projects"
              description="Projects you register on chain will be listed here."
              action={
                <Button variant="secondary" size="sm" onClick={() => window.location.assign('/projects/new')}>
                  Create a project
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {projects.data.slice(0, 5).map((project) => (
                <li key={project.projectId}>
                  <Card interactive>
                    <Link
                      to={`/projects/${project.projectId}`}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-secondary text-fg">
                          Project #{project.projectId}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[11px] text-fg-subtle">
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
        </section>
      )}

      <DisclosureNote>
        OpenForge runs on {DEFAULT_CHAIN.label}. Balances and payments shown anywhere in
        this app are test values and have no real-world worth.
      </DisclosureNote>

      {!profile.isPending && profile.data && (
        <p className="flex items-center gap-2 text-meta text-fg-subtle">
          <UserRound className="size-3.5" aria-hidden />
          Profile published as {profile.data.metadata.name}
        </p>
      )}
    </div>
  );
}
