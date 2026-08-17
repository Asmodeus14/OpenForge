'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FolderGit2, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { Page, PageHeader } from '@/components/ui/Layout';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { StatusPill } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { DisclosureNote } from '@/components/trust/Trust';
import { TransactionFlow } from '@/components/trust/TransactionFlow';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import { useProjectsByBuilder } from '@/hooks/queries';
import { useTransaction } from '@/hooks/useTransaction';
import { updateProjectStatus } from '@/chain/projectRegistry';
import { DEFAULT_CHAIN } from '@/chain/config';
import {
  ProjectStatus,
  allowedProjectTransitions,
  isTerminalProjectStatus,
  projectStatus,
} from '@/lib/status';
import type { ChainProject } from '@/chain/projectRegistry';

/**
 * Projects owned by the connected wallet.
 *
 * Status changes are offered only where the contract actually permits them
 * (Draft → Funding, Funding → Completed or Failed), so an impossible
 * transition is disabled in the interface rather than reverting in the
 * user's wallet after they have paid for gas.
 */
export function MyProjectsClient() {
  const wallet = useWalletContext();
  const projects = useProjectsByBuilder(wallet.account);
  const [pending, setPending] = useState<number | null>(null);

  const tx = useTransaction({
    onSuccess: () => {
      setPending(null);
      void projects.refetch();
    },
  });

  function changeStatus(project: ChainProject, next: ProjectStatus) {
    const from = projectStatus(project.status);
    const to = projectStatus(next);
    const terminal = isTerminalProjectStatus(next);
    const leavingDraft = project.status === ProjectStatus.Draft;

    setPending(project.projectId);
    tx.start({
      title: `Move project to ${to.label}`,
      actionLabel: `Move to ${to.label}`,
      irreversible: terminal || leavingDraft,
      facts: [
        { label: 'Project', value: `#${project.projectId}` },
        { label: 'Current status', value: from.label },
        { label: 'New status', value: to.label, emphasis: true },
        { label: 'Network', value: DEFAULT_CHAIN.label },
      ],
      disclosures: [
        to.description,
        ...(leavingDraft
          ? [
              'Once a project leaves Draft its title, description, tags and cover image are permanent and cannot be edited again.',
            ]
          : []),
        ...(terminal
          ? ['Completed and Failed are final. A project cannot move out of either.']
          : []),
      ],
      failureReassurance: 'The project status was not changed.',
      successSummary: `Project #${project.projectId} is now ${to.label}.`,
      steps: [
        {
          label: `Set status to ${to.label}`,
          kind: 'send',
          run: (signer) => updateProjectStatus(signer, project.projectId, next),
        },
      ],
    });
  }

  /* ------------------------------------------------------------ no wallet */

  if (!wallet.account) {
    return (
      <Page>
        <PageHeader title="Projects" description="Projects registered to your wallet." />
        <div className="border-t border-line">
          <EmptyState
            icon={<Wallet className="size-5" aria-hidden />}
            title="Connect a wallet to see your projects"
            description="Projects are registered against a wallet address. Connecting only reads public data."
            action={
              <Button
                variant="primary"
                onClick={wallet.connect}
                loading={wallet.isConnecting}
                leadingIcon={<Wallet className="size-4" aria-hidden />}
              >
                Connect wallet
              </Button>
            }
          />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Projects"
        description="Projects registered to your wallet address."
        actions={
          <Link href="/projects/new" className={buttonClasses({ variant: 'primary' })}>
            <Plus className="size-4" aria-hidden />
            New project
          </Link>
        }
      />

      <div className="border-t border-line pt-8 pb-16">
        {projects.isError ? (
          <ErrorState
            error={projects.error}
            context="Your projects could not be loaded"
            onRetry={() => void projects.refetch()}
          />
        ) : projects.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : projects.data.length === 0 ? (
          <EmptyState
            icon={<FolderGit2 className="size-5" aria-hidden />}
            title="No projects yet"
            description="A project describes what you are building so contributors can find it. Yours will appear here once registered."
            action={
              <Link href="/projects/new" className={buttonClasses({ variant: 'primary' })}>
                Create your first project
              </Link>
            }
          />
        ) : (
          <>
            <Table
              caption="Projects registered to your wallet"
              rows={projects.data}
              getRowKey={(project) => String(project.projectId)}
              columns={[
                {
                  key: 'id',
                  header: 'ID',
                  width: '4rem',
                  render: (project) => (
                    <span className="font-mono text-code text-fg-muted">
                      #{project.projectId}
                    </span>
                  ),
                },
                {
                  key: 'project',
                  header: 'Project',
                  render: (project) => (
                    <Link
                      href={`/projects/${project.projectId}`}
                      className="text-fg hover:underline underline-offset-4"
                    >
                      Project #{project.projectId}
                    </Link>
                  ),
                },
                {
                  key: 'cid',
                  header: 'Metadata',
                  hideOnMobile: true,
                  render: (project) => (
                    <span
                      className="font-mono text-code text-fg-muted"
                      title={project.metadataCid}
                    >
                      {project.metadataCid.slice(0, 12)}…
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (project) => <StatusPill status={projectStatus(project.status)} />,
                },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: (project) => {
                    const next = allowedProjectTransitions(project.status);
                    if (next.length === 0) {
                      return <span className="text-meta text-fg-muted">Final</span>;
                    }
                    return (
                      <span className="inline-flex gap-2">
                        {next.map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={
                              status === ProjectStatus.Failed ? 'ghost' : 'secondary'
                            }
                            loading={pending === project.projectId && tx.isBusy}
                            onClick={() => changeStatus(project, status)}
                          >
                            {projectStatus(status).label}
                          </Button>
                        ))}
                      </span>
                    );
                  },
                },
              ]}
            />

            <DisclosureNote className="mt-8">
              A project moves Draft → Funding → Completed or Failed, and never backwards.
              Details are editable only while it is a Draft.
            </DisclosureNote>
          </>
        )}
      </div>

      <TransactionFlow tx={tx} />
    </Page>
  );
}
