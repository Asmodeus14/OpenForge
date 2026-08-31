'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/States';
import { ProjectCard, type ProjectCardData } from '@/components/projects/ProjectCard';
import { cn } from '@/lib/cn';

/**
 * The interactive half of Discover.
 *
 * Data arrives already resolved from the server; this component only filters
 * it. Filtering happens client-side over what is loaded, because the
 * registry contract exposes no search — implying otherwise would misrepresent
 * what the system can actually do.
 */
export function DiscoverList({
  projects,
  total,
}: {
  projects: ProjectCardData[];
  total: number;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;

    return projects.filter((project) => {
      const haystack = [
        String(project.projectId),
        project.builder,
        project.metadata?.title ?? '',
        project.metadata?.description ?? '',
        ...(project.metadata?.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [projects, query]);

  return (
    <div className="border-t border-line pt-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name, tag, description or address"
          leadingIcon={<Search className="size-4" aria-hidden />}
          containerClassName="w-full max-w-sm"
          aria-label="Filter projects"
        />
        <p className="text-meta text-fg-muted">
          {filtered.length === total
            ? `${total} ${total === 1 ? 'project' : 'projects'}`
            : `${filtered.length} of ${total}`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5" aria-hidden />}
          title="No matches"
          description={`Nothing here matches “${query}”.`}
          action={
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear filter
            </Button>
          }
        />
      ) : (
        <ul
          className={cn(
            'mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
            // One result should not sit in the first cell of a three-track
            // grid with two empty tracks beside it. An almost-empty grid reads
            // as content that failed to load rather than as a registry with a
            // single entry, so a lone card collapses to its own column.
            filtered.length === 1 && 'max-w-sm sm:grid-cols-1 lg:grid-cols-1',
          )}
        >
          {filtered.map((project) => (
            <li key={project.projectId} className="flex">
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
