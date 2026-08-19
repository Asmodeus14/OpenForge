'use client';

import Link from 'next/link';
import { Plus, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { Page, PageHeader } from '@/components/ui/Layout';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Table } from '@/components/ui/Table';
import { DisclosureNote } from '@/components/trust/Trust';
import { Person } from '@/components/trust/Identity';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import { useEscrowProjects, useEscrowTitles } from '@/hooks/queries';
import { formatDate, isAddressEqual } from '@/lib/format';
import type { FactoryProject } from '@/chain/escrowFactory';

/**
 * Escrows belonging to the connected wallet.
 *
 * The registry indexes a wallet's projects whether it funded them or is
 * building them, so the role column exists to answer the first question
 * anyone has about a row: which side of this am I on, and therefore what can
 * I do here.
 *
 * Live state (funded / disputed / completed) is deliberately not fetched for
 * the whole list. Each row would need its own contract read, which is the
 * N-sequential-RPC-call pattern that made the previous version slow to load
 * and easy to rate-limit. State is shown on the detail page, where one read
 * answers it.
 */
export function EscrowListClient() {
  const wallet = useWalletContext();
  const escrows = useEscrowProjects(wallet.account);
  // Titles live on IPFS now, so they arrive after the rows do. The table
  // renders immediately with ids and fills the names in.
  const titles = useEscrowTitles(escrows.data);

  if (!wallet.account) {
    return (
      <Page>
        <PageHeader
          title="Escrow"
          description="Milestone escrows you have funded or are building."
        />
        <div className="border-t border-line">
          <EmptyState
            icon={<Wallet className="size-5" aria-hidden />}
            title="Connect a wallet to see your escrows"
            description="Escrows are indexed against a wallet address. Connecting only reads public data — nothing is signed."
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

  function roleOf(project: FactoryProject): string {
    if (isAddressEqual(project.funder, wallet.account)) return 'Funder';
    if (isAddressEqual(project.developer, wallet.account)) return 'Developer';
    return 'Observer';
  }

  return (
    <Page>
      <PageHeader
        title="Escrow"
        description="Milestone escrows you have funded or are building."
        actions={
          <Link href="/escrow/new" className={buttonClasses({ variant: 'primary' })}>
            <Plus className="size-4" aria-hidden />
            New escrow
          </Link>
        }
      />

      <div className="border-t border-line pt-8 pb-16">
        {escrows.isError ? (
          <ErrorState
            error={escrows.error}
            context="Your escrows could not be loaded"
            onRetry={() => void escrows.refetch()}
          />
        ) : escrows.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : escrows.data.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="size-5" aria-hidden />}
            title="No escrows yet"
            description="An escrow holds a funder's tokens and releases them milestone by milestone, only when the funder approves each one."
            action={
              <Link href="/escrow/new" className={buttonClasses({ variant: 'primary' })}>
                Create an escrow
              </Link>
            }
          />
        ) : (
          <>
            <Table
              caption="Escrows linked to your wallet"
              rows={escrows.data}
              getRowKey={(project) => String(project.projectId)}
              columns={[
                {
                  key: 'title',
                  header: 'Project',
                  render: (project) => (
                    <Link
                      href={`/escrow/${project.escrowAddress}`}
                      className="text-fg hover:underline underline-offset-4"
                    >
                      {titles.data?.[project.metadataCID] ||
                        `Escrow #${project.projectId}`}
                    </Link>
                  ),
                },
                {
                  key: 'role',
                  header: 'Your role',
                  render: (project) => (
                    <span className="text-fg-secondary">{roleOf(project)}</span>
                  ),
                },
                {
                  key: 'counterparty',
                  header: 'Counterparty',
                  hideOnMobile: true,
                  render: (project) => (
                    <Person
                      address={
                        isAddressEqual(project.funder, wallet.account)
                          ? project.developer
                          : project.funder
                      }
                      showExplorer={false}
                    />
                  ),
                },
                {
                  key: 'created',
                  header: 'Created',
                  hideOnMobile: true,
                  render: (project) => (
                    <span className="text-meta text-fg-muted">
                      {formatDate(project.createdAt) ?? 'Unknown'}
                    </span>
                  ),
                },
                {
                  key: 'open',
                  header: '',
                  align: 'right',
                  render: (project) => (
                    <Link
                      href={`/escrow/${project.escrowAddress}`}
                      className={buttonClasses({ variant: 'ghost', size: 'sm' })}
                    >
                      Open
                    </Link>
                  ),
                },
              ]}
            />

            <DisclosureNote className="mt-8">
              Only the funder can release or cancel milestones. The developer can raise a
              dispute, which pauses releases.
            </DisclosureNote>
          </>
        )}
      </div>
    </Page>
  );
}
