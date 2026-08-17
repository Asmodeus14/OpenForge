import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Layout';
import { StatusPill } from '@/components/ui/Badge';
import { AddressDisplay } from '@/components/trust/Trust';
import { projectStatus, type ProjectStatus } from '@/lib/status';
import { formatDate, truncate } from '@/lib/format';
import { ipfsUrl } from '@/lib/ipfs';
import type { ProjectMetadata } from '@/lib/project';
import { coverCidOf } from '@/lib/project';

export interface ProjectCardData {
  projectId: number;
  builder: string;
  status: ProjectStatus;
  metadata: ProjectMetadata | null;
}

/**
 * A project in a list.
 *
 * When the IPFS document cannot be resolved the card still renders — the
 * project ID, builder and status come from the chain and are true
 * regardless. It says the details are unavailable rather than inventing a
 * title, and never substitutes a placeholder image from a third-party
 * service the way the previous implementation did.
 */
export function ProjectCard({ project }: { project: ProjectCardData }) {
  const { metadata } = project;
  const cover = coverCidOf(metadata);
  const created = metadata ? formatDate(metadata.createdAt) : null;

  return (
    <Card interactive className="overflow-hidden">
      <Link href={`/projects/${project.projectId}`} className="flex h-full flex-col">
        {cover && (
          <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-line bg-subtle">
            <Image
              src={ipfsUrl(cover)}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              unoptimized={ipfsUrl(cover).includes('pinataGatewayToken')}
            />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 truncate text-section text-fg">
              {metadata?.title ?? `Project #${project.projectId}`}
            </h3>
            <StatusPill status={projectStatus(project.status)} />
          </div>

          <p className="flex-1 text-secondary text-fg-secondary">
            {metadata
              ? truncate(metadata.description, 140)
              : 'Details for this project are stored on IPFS and could not be loaded.'}
          </p>

          {metadata && metadata.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {metadata.tags.slice(0, 4).map((tag) => (
                <li
                  key={tag}
                  className="rounded-sm border border-line px-2 py-0.5 text-micro text-fg-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-line-faint pt-3">
            <AddressDisplay address={project.builder} showExplorer={false} showCopy={false} />
            <span className="shrink-0 text-micro text-fg-muted">
              {created ?? `#${project.projectId}`}
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
