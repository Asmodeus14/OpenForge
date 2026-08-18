'use client';

import Link from 'next/link';
import { CircleAlert, CircleCheck, Info, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/States';
import { AddressDisplay } from '@/components/trust/Trust';
import {
  useAddressActivity,
  useProfile,
  useProjectsByBuilder,
} from '@/hooks/queries';
import { DEFAULT_CHAIN } from '@/chain/config';
import { formatCount, isAddressEqual, shortenAddress } from '@/lib/format';

/**
 * Who is about to be paid.
 *
 * A milestone escrow sends every release to one immutable address chosen by
 * typing it into a text field. Getting a character wrong is unrecoverable —
 * the contract cannot be amended and there is nobody to appeal to. So before
 * anything is deployed, everything the chain can say about that address is
 * put on screen.
 *
 * Three of the four signals are unforgeable and come straight from the node:
 * whether the address has bytecode, how many transactions it has ever sent,
 * and which projects list it as their builder. The fourth — the profile name
 * — is self-asserted, and is labelled as such. Presenting a registered name
 * as though it were verified identity would be exactly the kind of fake trust
 * signal this product exists to avoid.
 */

export interface LinkedProject {
  projectId: number;
  builder: string;
  title: string | null;
}

type SignalTone = 'ok' | 'warn' | 'neutral';

const SIGNAL_ICON: Record<SignalTone, typeof CircleCheck> = {
  ok: CircleCheck,
  warn: CircleAlert,
  neutral: Minus,
};

const SIGNAL_COLOUR: Record<SignalTone, string> = {
  ok: 'text-success-text',
  warn: 'text-warning-text',
  neutral: 'text-fg-muted',
};

function Signal({
  tone,
  children,
}: {
  tone: SignalTone;
  children: React.ReactNode;
}) {
  const Icon = SIGNAL_ICON[tone];
  return (
    <li className="flex items-start gap-2.5 py-1.5 text-meta text-fg-secondary">
      <Icon className={cn('mt-0.5 size-3.5 shrink-0', SIGNAL_COLOUR[tone])} aria-hidden />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

export function RecipientCheck({
  address,
  linkedProject,
  className,
}: {
  /** A syntactically valid address. Callers gate on that before rendering. */
  address: string;
  /** Set when the escrow was opened from a specific project. */
  linkedProject?: LinkedProject | null;
  className?: string;
}) {
  const profile = useProfile(address);
  const activity = useAddressActivity(address);
  const builtProjects = useProjectsByBuilder(address);

  const loading = profile.isLoading || activity.isLoading || builtProjects.isLoading;

  // The one check that can be decisively wrong rather than merely unusual.
  const builderMismatch =
    linkedProject !== null &&
    linkedProject !== undefined &&
    !isAddressEqual(address, linkedProject.builder);

  const name = profile.data?.metadata.name;
  const projects = builtProjects.data ?? [];

  return (
    <div
      className={cn(
        'rounded-lg border bg-subtle px-4 py-3.5',
        builderMismatch ? 'border-warning-line' : 'border-line',
        className,
      )}
    >
      <p className="text-micro uppercase tracking-wide text-fg-muted">Recipient check</p>

      {loading ? (
        <div className="mt-3 flex flex-col gap-2.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      ) : (
        <>
          {/* ------------------------------------------------------ identity */}
          <div className="mt-3 flex items-center gap-3">
            <Avatar
              src={profile.data?.avatarUrl}
              name={name}
              address={address}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate text-secondary text-fg">
                {name ?? shortenAddress(address, 6)}
              </p>
              <p className="text-meta text-fg-muted">
                {profile.data ? (
                  <Link
                    href={`/profile/${address}`}
                    className="text-accent-text hover:underline underline-offset-4"
                  >
                    View profile
                  </Link>
                ) : (
                  'No OpenForge profile registered'
                )}
              </p>
            </div>
          </div>

          {/* ------------------------------------------------------- signals */}
          <ul className="mt-3 border-t border-line-faint pt-2">
            {linkedProject &&
              (builderMismatch ? (
                <Signal tone="warn">
                  This is <strong className="font-medium text-fg">not</strong> the builder
                  of project #{linkedProject.projectId}. That project is registered to{' '}
                  <AddressDisplay
                    address={linkedProject.builder}
                    chars={4}
                    showExplorer={false}
                  />
                  .
                </Signal>
              ) : (
                <Signal tone="ok">
                  Registered on chain as the builder of project #
                  {linkedProject.projectId}
                  {linkedProject.title ? ` — ${linkedProject.title}` : ''}.
                </Signal>
              ))}

            {projects.length > 0 ? (
              <Signal tone="ok">
                Builder of {formatCount(projects.length)}{' '}
                {projects.length === 1 ? 'project' : 'projects'} in the registry
                {projects.length <= 3 && (
                  <>
                    {': '}
                    {projects.map((project, index) => (
                      <span key={project.projectId}>
                        {index > 0 && ', '}
                        <Link
                          href={`/projects/${project.projectId}`}
                          className="text-accent-text hover:underline underline-offset-4"
                        >
                          #{project.projectId}
                        </Link>
                      </span>
                    ))}
                  </>
                )}
                .
              </Signal>
            ) : (
              <Signal tone="neutral">
                Has not registered any project on OpenForge. That is common and not a
                problem in itself.
              </Signal>
            )}

            {activity.data &&
              (activity.data.outgoingTransactions === 0 ? (
                <Signal tone="warn">
                  This address has never sent a transaction on {DEFAULT_CHAIN.name}. An
                  unused address is the usual sign of a mistyped one.
                </Signal>
              ) : (
                <Signal tone="ok">
                  Has sent {formatCount(activity.data.outgoingTransactions)}{' '}
                  {activity.data.outgoingTransactions === 1 ? 'transaction' : 'transactions'}{' '}
                  on {DEFAULT_CHAIN.name}.
                </Signal>
              ))}

            {activity.data?.isContract && (
              <Signal tone="warn">
                This address is a contract, not a wallet. Releases are sent with a plain
                token transfer — if the contract cannot move tokens, the payment is stuck
                there permanently.
              </Signal>
            )}
          </ul>

          {/* ---------------------------------------------------- the caveat */}
          <p className="mt-2.5 flex items-start gap-2.5 border-t border-line-faint pt-2.5 text-meta text-fg-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              A profile proves this address registered that name — not that the person
              behind it is who they say. Confirm the address itself with the developer over
              a channel you already trust.
            </span>
          </p>
        </>
      )}
    </div>
  );
}
