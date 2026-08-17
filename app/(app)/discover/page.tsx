import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, Plus } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/States';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { loadRecentProjects } from '@/lib/server/projects';
import { DiscoverList } from './DiscoverList';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Projects registered on the OpenForge project registry.',
};

/**
 * Chain state changes slowly and this page is public, so it is cached and
 * revalidated periodically rather than re-read on every request.
 */
export const revalidate = 30;

export default async function DiscoverPage() {
  const { projects, total } = await loadRecentProjects();

  return (
    <Page>
      <PageHeader
        title="Discover"
        description="Every project registered on the OpenForge project registry."
        actions={
          <Link href="/projects/new" className={buttonClasses({ variant: 'primary' })}>
            <Plus className="size-4" aria-hidden />
            New project
          </Link>
        }
      />

      {projects.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState
            icon={<Compass className="size-5" aria-hidden />}
            title="No projects yet"
            description="Nothing has been registered on the project registry on this network. The first project published will appear here."
            action={
              <Link href="/projects/new" className={buttonClasses({ variant: 'primary' })}>
                Create the first project
              </Link>
            }
          />
        </div>
      ) : (
        <DiscoverList projects={projects} total={total} />
      )}
    </Page>
  );
}
