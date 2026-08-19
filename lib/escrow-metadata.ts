/**
 * Off-chain metadata for an escrow-backed project.
 *
 * The v1 contracts stored a title, a description, a `string[]` of tags and a
 * description per milestone in contract storage — ten slots for the project
 * record alone, and one whole slot per milestone description. All of it is
 * text that nothing on chain can act on, and correcting a typo meant sending a
 * transaction. It lives on IPFS now, and the contract keeps a single CID.
 *
 * Everything here is presentational. No decision about money reads any of it,
 * which is why a missing or unreachable CID degrades to milestone numbers
 * rather than blocking the page: the amounts, deadlines and parties are all on
 * chain and are what actually govern.
 */

export interface EscrowMetadata {
  type: 'escrow';
  version: '1.0';
  title: string;
  description: string;
  tags: string[];
  /** Parallel to the on-chain milestone array — index `i` describes milestone `i`. */
  milestones: { title: string; description?: string }[];
  createdAt: number;
}

export const ESCROW_METADATA_LIMITS = {
  titleMin: 3,
  titleMax: 100,
  descriptionMin: 10,
  descriptionMax: 1000,
  milestoneTitleMax: 120,
  tagMax: 30,
  tagsMax: 10,
} as const;

export function buildEscrowMetadata(input: {
  title: string;
  description: string;
  tags: string[];
  milestones: { title: string; description?: string }[];
}): EscrowMetadata {
  return {
    type: 'escrow',
    version: '1.0',
    title: input.title.trim(),
    description: input.description.trim(),
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
    milestones: input.milestones.map((milestone) => ({
      title: milestone.title.trim(),
      ...(milestone.description?.trim() ? { description: milestone.description.trim() } : {}),
    })),
    createdAt: Math.floor(Date.now() / 1000),
  };
}

/**
 * Milestone titles by index, for the ledger and the confirmation dialogs.
 *
 * Deliberately tolerant. This data is fetched from a public gateway and is not
 * validated by any contract, so it can be absent, truncated, or a longer list
 * than the escrow actually has. None of those is worth failing a page over.
 */
export function milestoneNames(
  metadata: EscrowMetadata | undefined | null,
): Record<number, string> {
  if (!metadata?.milestones) return {};

  const names: Record<number, string> = {};
  metadata.milestones.forEach((milestone, index) => {
    const title = typeof milestone?.title === 'string' ? milestone.title.trim() : '';
    if (title) names[index] = title;
  });
  return names;
}
