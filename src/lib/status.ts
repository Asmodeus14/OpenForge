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

export interface StatusDescriptor {
  label: string;
  tone: Tone;
  /** lucide-react icon name, resolved by the Badge/StatusPill component. */
  icon: string;
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

/* ------------------------------------------ SimpleMilestoneEscrow.ProjectState */

/** Mirrors the on-chain enum: Created=0, Funded=1, Completed=2, Cancelled=3, Disputed=4. */
export const EscrowState = {
  Created: 0,
  Funded: 1,
  Completed: 2,
  Cancelled: 3,
  Disputed: 4,
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
  [EscrowState.Completed]: {
    label: 'Completed',
    tone: 'success',
    icon: 'CircleCheck',
    description: 'Every milestone has been released or cancelled. Final state.',
  },
  [EscrowState.Cancelled]: {
    label: 'Cancelled',
    tone: 'neutral',
    icon: 'CircleSlash',
    description: 'The project was cancelled and remaining funds returned to the funder. Final state.',
  },
  [EscrowState.Disputed]: {
    label: 'Disputed',
    tone: 'danger',
    icon: 'TriangleAlert',
    description: 'A dispute is open. Releases are paused until it is resolved.',
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
  const n = Number(state);
  return n === EscrowState.Completed || n === EscrowState.Cancelled;
}

/* ------------------------------------------------------------- milestones */

export type MilestoneStatus = 'released' | 'cancelled' | 'overdue' | 'pending';

const MILESTONE_STATUS: Record<MilestoneStatus, StatusDescriptor> = {
  released: {
    label: 'Released',
    tone: 'success',
    icon: 'CircleCheck',
    description: 'Payment for this milestone has been sent to the developer.',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'neutral',
    icon: 'CircleSlash',
    description: 'This milestone was cancelled and its funds returned to the funder.',
  },
  overdue: {
    label: 'Overdue',
    tone: 'warning',
    icon: 'CalendarClock',
    description:
      'The deadline has passed. The funder may still release it, or may now cancel it.',
  },
  pending: {
    label: 'Pending',
    tone: 'neutral',
    icon: 'Circle',
    description: 'Not yet released. Only the funder can release this milestone.',
  },
};

/**
 * Derives a milestone's status from on-chain fields.
 *
 * Note the contract deliberately allows release *after* the deadline — the
 * deadline only gates cancellation. So "overdue" is informational, not a
 * blocker on payment.
 */
export function milestoneStatus(milestone: {
  released: boolean;
  cancelled: boolean;
  deadline: bigint;
}): StatusDescriptor & { key: MilestoneStatus } {
  let key: MilestoneStatus;

  if (milestone.released) key = 'released';
  else if (milestone.cancelled) key = 'cancelled';
  else if (milestone.deadline > 0n && Date.now() / 1000 > Number(milestone.deadline))
    key = 'overdue';
  else key = 'pending';

  return { ...MILESTONE_STATUS[key], key };
}
