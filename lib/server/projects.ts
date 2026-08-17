import 'server-only';

import { getReadProvider } from '@/chain/clients';
import { getProject, getRecentProjects, type ChainProject } from '@/chain/projectRegistry';
import { fetchIpfsJson } from '@/lib/ipfs';
import { parseProjectMetadata, type ProjectMetadata } from '@/lib/project';
import type { ProjectCardData } from '@/components/projects/ProjectCard';

/**
 * Server-side project loading.
 *
 * Reading the chain and IPFS on the server means the first paint already
 * contains real content — no spinner, no client-side RPC waterfall, and the
 * page is indexable. The Vite app could only ever fetch after hydration.
 *
 * Metadata failures are contained per project: one unresolvable CID must not
 * blank out an entire listing.
 */

async function withMetadata(project: ChainProject): Promise<ProjectCardData> {
  let metadata: ProjectMetadata | null = null;
  try {
    metadata = parseProjectMetadata(await fetchIpfsJson(project.metadataCid));
  } catch {
    // Left null — the card renders the on-chain facts and says the rest is
    // unavailable.
  }
  return {
    projectId: project.projectId,
    builder: project.builder,
    status: project.status,
    metadata,
  };
}

export async function loadRecentProjects(limit = 24): Promise<{
  projects: ProjectCardData[];
  total: number;
}> {
  const provider = getReadProvider();
  const { projects, total } = await getRecentProjects(provider, 0, limit);
  return {
    projects: await Promise.all(projects.map(withMetadata)),
    total,
  };
}

export async function loadProject(projectId: number): Promise<{
  project: ProjectCardData;
  metadataCid: string;
} | null> {
  try {
    const provider = getReadProvider();
    const chainProject = await getProject(projectId, provider);
    return {
      project: await withMetadata(chainProject),
      metadataCid: chainProject.metadataCid,
    };
  } catch {
    // The registry reverts for an id beyond `nextProjectId`, which is simply
    // a project that does not exist.
    return null;
  }
}
