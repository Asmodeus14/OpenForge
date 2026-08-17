/**
 * Project metadata — the document stored on IPFS and referenced on chain.
 *
 * The previous codebase declared this shape twice, in two files, with
 * subtly different fields, and wrote `createdAt` as a number in one place
 * and an ISO string in another. One definition here, tolerant on read and
 * strict on write.
 */

export interface ProjectImage {
  cid: string;
  type: 'cover' | 'gallery';
}

export interface ProjectMetadata {
  type: 'project';
  version: '1.0';
  title: string;
  description: string;
  tags: string[];
  images?: ProjectImage[];
  createdAt: number;
  updatedAt?: number;
}

export const PROJECT_LIMITS = {
  titleMin: 3,
  titleMax: 100,
  descriptionMin: 10,
  descriptionMax: 1000,
  tagMax: 30,
  tagsMax: 10,
  imageBytesMax: 5 * 1024 * 1024,
} as const;

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/**
 * Reads metadata from an untrusted IPFS document.
 *
 * Returns `null` rather than throwing when the document is unusable, so a
 * single malformed project cannot break a listing page. Callers render an
 * honest "details unavailable" state instead of inventing a title.
 */
export function parseProjectMetadata(value: unknown): ProjectMetadata | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;

  const title = typeof raw.title === 'string' ? raw.title : '';
  const description = typeof raw.description === 'string' ? raw.description : '';
  if (!title) return null;

  // Historic documents wrote createdAt as either epoch ms or an ISO string.
  let createdAt = 0;
  if (typeof raw.createdAt === 'number') createdAt = raw.createdAt;
  else if (typeof raw.createdAt === 'string') {
    const parsed = Date.parse(raw.createdAt);
    if (!Number.isNaN(parsed)) createdAt = parsed;
  }

  const images = Array.isArray(raw.images)
    ? (raw.images as unknown[]).flatMap((image) => {
        if (!image || typeof image !== 'object') return [];
        const item = image as Record<string, unknown>;
        if (typeof item.cid !== 'string') return [];
        return [
          {
            cid: item.cid,
            type: item.type === 'gallery' ? ('gallery' as const) : ('cover' as const),
          },
        ];
      })
    : undefined;

  return {
    type: 'project',
    version: '1.0',
    title,
    description,
    tags: Array.isArray(raw.tags)
      ? (raw.tags as unknown[]).filter((tag): tag is string => typeof tag === 'string')
      : [],
    images,
    createdAt,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : undefined,
  };
}

export interface ProjectDraft {
  title: string;
  description: string;
  tags: string[];
  coverCid?: string;
}

/** Field-level validation, so errors attach to the input that caused them. */
export function validateProjectDraft(draft: ProjectDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = draft.title.trim();
  const description = draft.description.trim();

  if (title.length < PROJECT_LIMITS.titleMin) {
    errors.title = `Use at least ${PROJECT_LIMITS.titleMin} characters.`;
  } else if (title.length > PROJECT_LIMITS.titleMax) {
    errors.title = `Keep this under ${PROJECT_LIMITS.titleMax} characters.`;
  }

  if (description.length < PROJECT_LIMITS.descriptionMin) {
    errors.description = `Use at least ${PROJECT_LIMITS.descriptionMin} characters so people know what this is.`;
  } else if (description.length > PROJECT_LIMITS.descriptionMax) {
    errors.description = `Keep this under ${PROJECT_LIMITS.descriptionMax} characters.`;
  }

  if (draft.tags.length > PROJECT_LIMITS.tagsMax) {
    errors.tags = `Use at most ${PROJECT_LIMITS.tagsMax} tags.`;
  }

  return errors;
}

export function buildProjectMetadata(
  draft: ProjectDraft,
  previous?: ProjectMetadata,
): ProjectMetadata {
  const now = Date.now();
  return {
    type: 'project',
    version: '1.0',
    title: draft.title.trim(),
    description: draft.description.trim(),
    tags: draft.tags,
    images: draft.coverCid ? [{ cid: draft.coverCid, type: 'cover' }] : undefined,
    // Creation date survives edits. The old builder wrote `undefined` here on
    // every update, permanently destroying the original date.
    createdAt: previous?.createdAt ?? now,
    ...(previous ? { updatedAt: now } : {}),
  };
}

export function coverCidOf(metadata: ProjectMetadata | null | undefined): string | undefined {
  return metadata?.images?.find((image) => image.type === 'cover')?.cid;
}
