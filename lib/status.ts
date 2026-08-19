/**
 * Status vocabulary.
 *
 * Replaces six independent status→label→colour mappings that had drifted
 * apart across Home, UserProjectSection, ProjectView-Personal,
 * ProjectView-Homepage, EsCrow and useUserProjects.
 *
 * Every descriptor carries a `label` and an `icon` as well as a `tone`,
 * because status must never be communicated by colour alone (§4).
 */

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

/**
 * The icons a status may use.
 *
 * Closed on purpose. These names are resolved to components by
 * `components/ui/statusIcons.ts`, which must map every one of them — so
 * adding a name here without adding the import there fails to compile,
 * rather than silently rendering a fallback dot in production.
 */
export type StatusIconName =
  | 'CalendarClock'
  | 'Circle'
  | 'CircleCheck'
  | 'CircleDollarSign'
  | 'CircleHelp'
  | 'CircleSlash'
  | 'CircleX'
  | 'Clock'
  | 'PencilLine'
  | 'ShieldCheck'
  | 'TriangleAlert';

export interface StatusDescriptor {
  label: string;
  tone: Tone;
  /** Resolved to a component by `components/ui/statusIcons.ts`. */
  icon: StatusIconName;
  /** Plain-language explanation of what this state means for the user. */
  description: string;
}

/* ------------------------------------------------- ProjectRegistry.Status */

/** Mirrors the on-chain enum: Draft=0, Funding=1, Completed=2, Failed=3.
 *  A const object rather than a TS `enum` — the build runs with
 *  `erasableSyntaxOnly`, which disallows enums. */
export const ProjectStatus = {
  Draft: 0,
  Funding: 1,
  Completed: 2,
  Failed: 3,
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

const PROJECT_STATUS: Record<ProjectStatus, StatusDescriptor> = {
  [ProjectStatus.Draft]: {
    label: 'Draft',
    tone: 'neutral',
    icon: 'PencilLine',
    description: 'Metadata can still be edited. Not yet open for funding.',
  },
  [ProjectStatus.Funding]: {
    label: 'Funding',
    tone: 'accent',
    icon: 'CircleDollarSign',
    description: 'Open for funding. Metadata is now locked and cannot be changed.',
  },
  [ProjectStatus.Completed]: {
    label: 'Completed',
    tone: 'success',
    icon: 'CircleCheck',
    description: 'Final state. This project can no longer be changed.',
  },
  [ProjectStatus.Failed]: {
    label: 'Failed',
    tone: 'danger',
    icon: 'CircleX',
    description: 'Final state. This project can no longer be changed.',
  },
};

export function projectStatus(status: ProjectStatus | number | bigint): StatusDescriptor {
  const key = Number(status) as ProjectStatus;
  return PROJECT_STATUS[key] ?? {
    label: 'Unknown',
    tone: 'neutral',
    icon: 'CircleHelp',
    description: 'This status is not recognised by the current interface.',
  };
}

/**
 * The contract permits only Draft→Funding and Funding→{Completed,Failed}.
 * Completed and Failed are terminal. Exposed so the UI can disable
 * impossible transitions instead of letting a transaction revert.
 */
export function allowedProjectTransitions(from: ProjectStatus | number): ProjectStatus[] {
  switch (Number(from)) {
    case ProjectStatus.Draft:
      return [ProjectStatus.Funding];
    case ProjectStatus.Funding:
      return [ProjectStatus.Completed, ProjectStatus.Failed];
    default:
      return [];
  }
}

export function isTerminalProjectStatus(status: ProjectStatus | number): boolean {
  const n = Number(status);
  return n === ProjectStatus.Completed || n === ProjectStatus.Failed;
}

/* ----------------------------------------------- MilestoneEscrow.State */

/**
 * Mirrors the on-chain enum: Created=0, Funded=1, Closed=2.
 *
 * There is no `Disputed` state any more, and its absence is the point. It used
 * to be a state with no exit: raising a dispute permanently ended milestone
 * releases and forced an all-or-nothing outcome, even if both parties agreed
 * minutes later that it had been a mistake. A dispute is now a time-boxed
 * freeze on the funder's ability to *reclaim* — see `disputeWindowSeconds` —
 * and is reported alongside the state rather than replacing it.
 *
 * `Completed` and `Cancelled` also collapsed into one terminal `Closed`. The
 * old pair was not reliably reachable: completion accepted "every milestone
 * released or cancelled" while cancellation required *all* cancelled, so a
 * project with one of each stayed active forever with a zero balance.
 */
export const EscrowState = {
  Created: 0,
  Funded: 1,
  Closed: 2,
} as const;

export type EscrowState = (typeof EscrowState)[keyof typeof EscrowState];

const ESCROW_STATE: Record<EscrowState, StatusDescriptor> = {
  [EscrowState.Created]: {
    label: 'Awaiting funds',
    tone: 'warning',
    icon: 'Clock',
    description:
      'The escrow contract is deployed but holds no funds. No work is protected yet.',
  },
  [EscrowState.Funded]: {
    label: 'Funded',
    tone: 'success',
    icon: 'ShieldCheck',
    description: 'Funds are held by the escrow contract and released per milestone.',
  },
  [EscrowState.Closed]: {
    label: 'Closed',
    tone: 'neutral',
    icon: 'CircleCheck',
    description:
      'Every milestone has been settled — released to the developer or returned to the funder. Final state.',
  },
};

export function escrowState(state: EscrowState | number | bigint): StatusDescriptor {
  const key = Number(state) as EscrowState;
  return ESCROW_STATE[key] ?? {
    label: 'Unknown',
    tone: 'neutral',
    icon: 'CircleHelp',
    description: 'This state is not recognised by the current interface.',
  };
}

export function isTerminalEscrowState(state: EscrowState | number): boolean {
  return Number(state) === EscrowState.Closed;
}

/**
 * Shown beside the state while a dispute is freezing reclaim.
 *
 * Deliberately not `danger`: a live dispute means nobody can lose money to a
 * deadline for the next fortnight, which is a protection, not a failure. It
 * decides nothing and moves nothing.
 */
export const DISPUTE_FROZEN: StatusDescriptor = {
  label: 'Disputed',
  tone: 'warning',
  icon: 'TriangleAlert',
  description:
    'A dispute is open. The funder cannot reclaim overdue milestones until it lapses, but can still release them.',
};

/* ------------------------------------------------------------- milestones */

/** Mirrors MilestoneEscrow.MilestoneStatus: Pending=0, Released=1, Reclaimed=2. */
export const OnChainMilestoneStatus = {
  Pending: 0,
  Released: 1,
  Reclaimed: 2,
} as const;

export type OnChainMilestoneStatus =
  (typeof OnChainMilestoneStatus)[keyof typeof OnChainMilestoneStatus];

/** The on-chain statuses, plus the one the UI derives from the clock. */
export type MilestoneStatus = 'released' | 'reclaimed' | 'overdue' | 'pending';

const MILESTONE_STATUS: Record<MilestoneStatus, StatusDescriptor> = {
  released: {
    label: 'Released',
    tone: 'success',
    icon: 'CircleCheck',
    description: 'Payment for this milestone has been sent to the developer.',
  },
  reclaimed: {
    label: 'Reclaimed',
    tone: 'neutral',
    icon: 'CircleSlash',
    description:
      'The deadline passed without release, and these funds went back to the funder.',
  },
  overdue: {
    label: 'Overdue',
    tone: 'warning',
    icon: 'CalendarClock',
    description:
      'The deadline has passed. The funder may still release this, or may now reclaim it.',
  },
  pending: {
    label: 'In progress',
    tone: 'neutral',
    icon: 'Circle',
    description:
      'Committed until the deadline. The funder can release this early but cannot take it back before then.',
  },
};

/**
 * Derives a milestone's status from on-chain fields.
 *
 * Two things the contract does that this has to reflect faithfully:
 *
 * Release is always allowed, deadline or not — paying the other party is never
 * something the contract blocks. So "overdue" changes who *else* can act, not
 * whether payment is still possible.
 *
 * Reclaim is allowed *only* once the deadline has passed. Before that the money
 * is genuinely committed, which is the developer's entire protection and the
 * reason deadlines are mandatory now.
 */
export function milestoneStatus(milestone: {
  status: OnChainMilestoneStatus | number;
  deadline: bigint;
}): StatusDescriptor & { key: MilestoneStatus } {
  let key: MilestoneStatus;

  const onChain = Number(milestone.status);
  if (onChain === OnChainMilestoneStatus.Released) key = 'released';
  else if (onChain === OnChainMilestoneStatus.Reclaimed) key = 'reclaimed';
  else if (Date.now() / 1000 > Number(milestone.deadline)) key = 'overdue';
  else key = 'pending';

  return { ...MILESTONE_STATUS[key], key };
}
