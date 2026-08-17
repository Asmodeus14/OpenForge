import type { ReactNode } from 'react';

/**
 * One line in a what / who / how-much / where block.
 *
 * `value` is a ReactNode rather than a string so that amounts render through
 * `TokenAmount` and addresses through `AddressDisplay`. That matters: it
 * means a figure shown in a confirmation dialog is produced by exactly the
 * same code as the figure shown on the page behind it, and the two cannot
 * drift apart in formatting or decimals.
 */
export interface Fact {
  label: string;
  value: ReactNode;
  /** Mono face — addresses, hashes, identifiers. */
  mono?: boolean;
  /** The single most important line, usually the amount. */
  emphasis?: boolean;
}
