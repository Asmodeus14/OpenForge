import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Plus, Search } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  StatusPill,
} from '../design/primitives';
import { AddressDisplay } from '../design/primitives/Trust';
import { useIpfsJson, useRecentProjects } from '../hooks/queries';
import type { ChainProject } from '../chain/projectRegistry';
import { projectStatus } from '../lib/status';
import { formatDate, truncate } from '../lib/format';
import { ipfsUrl } from '../lib/ipfs';
import { PageHeader } from '../app/PageHeader';

interface ProjectMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  images?: { cid: string; type: string }[];
  createdAt?: number | string;
}

/**
 * A project card.
 *
 * Metadata lives on IPFS and is fetched per card. When it cannot be resolved
 * the card still renders with the on-chain facts it does have — the project
 * ID, builder and status are real regardless — and says plainly that the
 * details are unavailable, rather than inventing a title.
 */
function ProjectCard({ project }: { project: ChainProject }) {
  const { data, isPending, isError } = useIpfsJson<ProjectMetadata>(project.metadataCid);
  const status = projectStatus(project.status);
  const cover = data?.images?.find((image) => image.type === 'cover');

  return (
    <Card interactive className="overflow-hidden">
      <Link to={`/projects/${project.projectId}`} className="block">
        {cover && (
          <img
            src={ipfsUrl(cover.cid)}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-[16/7] w-full object-cover"
          />
        )}

        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {isPending ? (
                <Skeleton className="h-5 w-40" />
              ) : (
                <h3 className="truncate text-section text-fg">
                  {data?.title || `Project #${project.projectId}`}
                </h3>
              )}
              <p className="mt-0.5 font-mono text-[11px] text-fg-subtle">
                #{project.projectId}
              </p>
            </div>
            <StatusPill status={status} />
          </div>

          {isPending ? (
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ) : isError ? (
            <p className="text-meta text-fg-subtle">
              Project details are stored on IPFS and could not be loaded right now.
            </p>
          ) : (
            data?.description && (
              <p className="text-secondary text-fg-muted">
                {truncate(data.description, 130)}
              </p>
            )
          )}

          {data?.tags && data.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {data.tags.slice(0, 4).map((tag) => (
                <li
                  key={tag}
                  className="rounded-sm border border-line bg-raised px-1.5 py-0.5 text-[11px] text-fg-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
            <AddressDisplay
              address={project.builder}
              chars={4}
              showExplorer={false}
            />
            {data?.createdAt && (
              <span className="shrink-0 text-meta text-fg-subtle">
                {formatDate(data.createdAt)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card className="p-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-2 h-3 w-24" />
      <div className="mt-4 flex flex-col gap-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="mt-4 h-3 w-32" />
    </Card>
  );
}

/**
 * Discover — every project registered on chain.
 *
 * Search filters what is already loaded rather than pretending to query the
 * chain, because `ProjectRegistry` exposes no search and claiming otherwise
 * would misrepresent what the system can do.
 */
export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const { data, isPending, isError, error, refetch } = useRecentProjects(0, 24);

  const projects = data?.projects ?? [];
  const filtered = query.trim()
    ? projects.filter((project) => {
        const needle = query.toLowerCase();
        return (
          String(project.projectId).includes(needle) ||
          project.builder.toLowerCase().includes(needle)
        );
      })
    : projects;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Discover"
        description="Projects registered on the OpenForge project registry."
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

      {!isPending && !isError && projects.length > 0 && (
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by project ID or builder address"
          leadingIcon={<Search className="size-4" aria-hidden />}
          containerClassName="mt-6 max-w-sm"
          aria-label="Filter projects"
        />
      )}

      <div className="mt-6">
        {isError ? (
          <ErrorState
            error={error}
            context="Projects could not be loaded"
            onRetry={() => void refetch()}
          />
        ) : isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          query ? (
            <EmptyState
              icon={<Search className="size-5" aria-hidden />}
              title="No matches"
              description={`Nothing here matches “${query}”. Filtering works on project ID and builder address.`}
              action={
                <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                  Clear filter
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Compass className="size-5" aria-hidden />}
              title="No projects yet"
              description="Nothing has been registered on the project registry on this network. The first project published will appear here."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  leadingIcon={<Plus className="size-4" aria-hidden />}
                  onClick={() => window.location.assign('/projects/new')}
                >
                  Create the first project
                </Button>
              }
            />
          )
        ) : (
          <>
            <p className="mb-3 text-meta text-fg-subtle">
              {filtered.length} of {data?.total ?? filtered.length}{' '}
              {(data?.total ?? 0) === 1 ? 'project' : 'projects'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <ProjectCard key={project.projectId} project={project} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
