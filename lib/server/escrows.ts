import 'server-only';

import { getReadProvider } from '@/chain/clients';
import { getAllProjects, type FactoryProject } from '@/chain/escrowFactory';
import { fetchEscrowDetail, type EscrowDetail } from '@/chain/escrow';
import { fetchIpfsJson } from '@/lib/ipfs';
import type { EscrowMetadata } from '@/lib/escrow-metadata';
import { DEFAULT_CHAIN } from '@/chain/config';

/**
 * Public funding data.
 *
 * Every escrow is a public contract, so who funded what, how much is held and
 * how much has been paid out are all readable by anyone — no wallet required.
 * This loads that on the server so the funding page is a real, shareable,
 * indexable page rather than something only the parties can see.
 *
 * One `getAllProjects` call for the index, then the escrows and their metadata
 * in parallel. Reading each contract sequentially is what made these views slow
 * enough to look broken.
 *
 * Titles and descriptions come from IPFS now rather than contract storage, and
 * are resolved here on the server — doing it in the browser would be one
 * gateway fetch per row on a page that renders up to fifty.
 */

export interface FundedProject {
  listing: FactoryProject;
  /** `null` when the metadata could not be fetched. The row still renders. */
  metadata: EscrowMetadata | null;
  /** `null` when the contract could not be read — shown as such, not hidden. */
  escrow: EscrowDetail | null;
}

export interface FundingSummary {
  projects: FundedProject[];
  /** Escrows currently holding funds. */
  activeCount: number;
  /** Total still held across every readable escrow, per token symbol. */
  heldByToken: Record<string, { amount: bigint; decimals: number }>;
  /** Gross released across every readable escrow, per token symbol. */
  releasedByToken: Record<string, { amount: bigint; decimals: number }>;
}

export async function loadFunding(limit = 50): Promise<FundingSummary> {
  const provider = getReadProvider();
  const listings = await getAllProjects(provider, 0, limit);

  const projects = await Promise.all(
    listings.map(async (listing): Promise<FundedProject> => {
      const [escrow, metadata] = await Promise.all([
        fetchEscrowDetail(listing.escrowAddress, provider, DEFAULT_CHAIN.chainId).catch(
          // A listing can point at an address that will not read back as an
          // escrow. That row still exists and is still worth showing; it just
          // cannot report figures.
          () => null,
        ),
        listing.metadataCID
          ? fetchIpfsJson<EscrowMetadata>(listing.metadataCID).catch(() => null)
          : Promise.resolve(null),
      ]);

      return { listing, metadata, escrow };
    }),
  );

  const heldByToken: FundingSummary['heldByToken'] = {};
  const releasedByToken: FundingSummary['releasedByToken'] = {};

  for (const { escrow } of projects) {
    if (!escrow) continue;
    const { symbol, decimals } = escrow.token;

    heldByToken[symbol] ??= { amount: 0n, decimals };
    heldByToken[symbol].amount += escrow.contractBalance;

    releasedByToken[symbol] ??= { amount: 0n, decimals };
    releasedByToken[symbol].amount += escrow.releasedGross;
  }

  return {
    projects,
    activeCount: projects.filter((p) => p.escrow && p.escrow.contractBalance > 0n).length,
    heldByToken,
    releasedByToken,
  };
}
