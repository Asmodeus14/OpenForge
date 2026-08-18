import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Divider, Page, Section } from '@/components/ui/Layout';
import { StatusPill } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { AddressDisplay, DisclosureNote, TechnicalDetails } from '@/components/trust/Trust';
import { FactList } from '@/components/trust/Trust';
import { DEFAULT_CHAIN } from '@/chain/config';
import { loadProject } from '@/lib/server/projects';
import { coverCidOf } from '@/lib/project';
import { projectStatus } from '@/lib/status';
import { formatDate, truncate } from '@/lib/format';
import { ipfsPublicUrl, ipfsUrl } from '@/lib/ipfs';

/**
 * Deliberately has no `loading.tsx`. A loading file makes Next stream the
 * response, which flushes a 200 status before this component runs, so the
 * `notFound()` for a nonexistent project would render the 404 page with a 200
 * status code. Verified by measurement — do not add one back.
 */
export const revalidate = 30;

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  const id = Number(projectId);
  if (!Number.isInteger(id) || id < 0) return { title: 'Project' };

  const result = await loadProject(id);
  const title = result?.project.metadata?.title ?? `Project #${id}`;
  const description = result?.project.metadata?.description;

  return {
    title,
    description: description ? truncate(description, 160) : undefined,
  };
}

/**
 * Project detail.
 *
 * Everything shown here is read from the chain or the project's own IPFS
 * document. The previous version of this page rendered `stars: 0`,
 * `contributors: 0` and a funding block of `{target: 0, raised: 0}` as
 * though they were live figures — they were hardcoded literals that were
 * never fetched — alongside a star button that only set local state, a
 * fabricated "Web3 Builder" biography, and a "Technology Used" section
 * produced by regex-matching 27 keywords against the free-text description.
 * All of that is gone rather than restyled.
 */
export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;
  const id = Number(projectId);
  if (!Number.isInteger(id) || id < 0) notFound();

  const result = await loadProject(id);
  if (!result) notFound();

  const { project, metadataCid } = result;
  const { metadata } = project;
  const cover = coverCidOf(metadata);
  const status = projectStatus(project.status);

  return (
    <Page>
      <div className="pt-8">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-meta text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Discover
        </Link>
      </div>

      <header className="pt-6 pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={status} />
          <span className="font-mono text-micro text-fg-muted">#{project.projectId}</span>
        </div>

        <h1 className="mt-4 text-title text-fg">
          {metadata?.title ?? `Project #${project.projectId}`}
        </h1>

        {metadata?.description ? (
          <p className="mt-4 max-w-2xl text-lead text-fg-secondary whitespace-pre-line">
            {metadata.description}
          </p>
        ) : (
          <p className="mt-4 max-w-2xl text-lead text-fg-secondary">
            This project&rsquo;s details are stored on IPFS and could not be loaded. The
            information below comes directly from the chain and is unaffected.
          </p>
        )}

        <p className="mt-5 text-meta text-fg-muted">{status.description}</p>
      </header>

      {cover && (
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-line bg-subtle">
          <Image
            src={ipfsUrl(cover)}
            alt=""
            fill
            sizes="(max-width: 1120px) 100vw, 1120px"
            className="object-cover"
            priority
            unoptimized={ipfsUrl(cover).includes('pinataGatewayToken')}
          />
        </div>
      )}

      {metadata && metadata.tags.length > 0 && (
        <Section title="Tags" divided={Boolean(cover)}>
          <ul className="flex flex-wrap gap-2">
            {metadata.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-line px-2.5 py-1 text-meta text-fg-secondary"
              >
                {tag}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Details">
        <FactList
          facts={[
            {
              label: 'Builder',
              value: <AddressDisplay address={project.builder} chars={6} />,
            },
            { label: 'Status', value: status.label },
            ...(metadata?.createdAt
              ? [{ label: 'Created', value: formatDate(metadata.createdAt) ?? '—' }]
              : []),
            ...(metadata?.updatedAt
              ? [{ label: 'Last updated', value: formatDate(metadata.updatedAt) ?? '—' }]
              : []),
          ]}
        />
      </Section>

      {/* The two registries are disjoint by design: a project registered here
          has no escrow, and an escrow's project lives in a different contract
          with its own ids. Saying so is better than leaving a funding figure
          conspicuously absent and letting people assume it is zero. */}
      <Section title="Funding">
        <p className="max-w-2xl text-body text-fg-secondary">
          This entry is a description of a project. It does not hold funds — money on
          OpenForge lives in a separate milestone escrow contract, deployed per agreement
          between a funder and a developer.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {/* Carries the id so the escrow form can pre-fill the builder's
              address from the registry and then say, on screen, whether the
              address in the field is still that builder. */}
          <Link
            href={`/escrow/new?project=${project.projectId}`}
            className={buttonClasses({ variant: 'primary' })}
          >
            Fund this work through an escrow
          </Link>
          <Link href="/funding" className={buttonClasses()}>
            See what&rsquo;s already funded
          </Link>
        </div>
      </Section>

      <Section title="Verify">
        <p className="mb-5 max-w-2xl text-secondary text-fg-secondary">
          This project exists on chain. You can inspect the registry entry and the metadata
          document yourself — nothing here depends on trusting this interface.
        </p>

        <TechnicalDetails summary="On-chain and storage references">
          <FactList
            facts={[
              { label: 'Network', value: DEFAULT_CHAIN.label },
              {
                label: 'Registry contract',
                value: (
                  <AddressDisplay
                    address={DEFAULT_CHAIN.contracts.projectRegistry}
                    chars={6}
                  />
                ),
              },
              { label: 'Project ID', value: String(project.projectId), mono: true },
              {
                label: 'Metadata',
                value: (
                  <a
                    href={ipfsPublicUrl(metadataCid)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-mono text-code text-accent-text hover:underline underline-offset-4"
                  >
                    {metadataCid}
                  </a>
                ),
              },
            ]}
          />
        </TechnicalDetails>
      </Section>

      <Divider />

      <div className="py-10">
        <DisclosureNote>
          Project metadata can only be edited while a project is a Draft. Once it moves to
          Funding the document is permanent, and Completed and Failed are final states.
        </DisclosureNote>
      </div>
    </Page>
  );
}
