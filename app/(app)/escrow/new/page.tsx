import type { Metadata } from 'next';
import { loadProject } from '@/lib/server/projects';
import { decodeProposalParam } from '@/lib/proposalLink';
import { DeployEscrowWizard } from './DeployEscrowWizard';

export const metadata: Metadata = {
  title: 'New escrow',
  description: 'Lock funds in a contract that pays out milestone by milestone.',
};

interface Props {
  searchParams: Promise<{
    /** `?project=<id>` arrives from a project page's "fund this work" action. */
    project?: string;
    /** `?proposal=…` carries terms already agreed in a conversation. */
    proposal?: string;
  }>;
}

/**
 * Resolving the project on the server means the developer address is already
 * in the field on first paint — the funder never sees an empty box they might
 * fill in from memory, and the address they are shown came from the registry
 * rather than from anything typed in this session.
 *
 * A bad or missing id degrades to the ordinary blank form rather than a 404:
 * creating an escrow from scratch is a legitimate way to reach this page. The
 * same applies to a malformed `proposal` — it fills in a form, so there is
 * nothing to fail loudly about.
 */
export default async function NewEscrowPage({ searchParams }: Props) {
  const { project, proposal } = await searchParams;
  const id = Number(project);

  const result =
    project !== undefined && Number.isInteger(id) && id >= 0
      ? await loadProject(id)
      : null;

  return (
    <DeployEscrowWizard
      proposal={decodeProposalParam(proposal)}
      linkedProject={
        result
          ? {
              projectId: result.project.projectId,
              builder: result.project.builder,
              title: result.project.metadata?.title ?? null,
              description: result.project.metadata?.description ?? null,
              tags: result.project.metadata?.tags ?? [],
            }
          : null
      }
    />
  );
}
