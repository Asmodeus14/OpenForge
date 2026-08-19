/**
 * Maps status icon names to components.
 *
 * `lib/status.ts` stores icons as strings, which Badge previously resolved
 * with `import * as Icons from 'lucide-react'` and a dynamic lookup. A
 * namespace import of a barrel file is opaque to the bundler: it cannot know
 * which of the ~1,600 icons a runtime string will select, so it keeps them
 * all. Badge sits in the shared shell chunk, so every route paid for it.
 *
 * Naming each import makes the set statically knowable and tree-shakeable.
 * `Record<StatusIconName, …>` is what keeps this honest — a name added to the
 * union without an import here is a compile error, not a missing icon.
 *
 * `lib/navigation.ts` already stored components rather than names; this brings
 * status in line with it.
 */
import type { ComponentType } from 'react';
import {
  CalendarClock,
  Circle,
  CircleCheck,
  CircleDollarSign,
  CircleHelp,
  CircleSlash,
  CircleX,
  Clock,
  PencilLine,
  ShieldCheck,
  TriangleAlert,
  type LucideProps,
} from 'lucide-react';
import type { StatusIconName } from '@/lib/status';

export const STATUS_ICONS: Record<StatusIconName, ComponentType<LucideProps>> = {
  CalendarClock,
  Circle,
  CircleCheck,
  CircleDollarSign,
  CircleHelp,
  CircleSlash,
  CircleX,
  Clock,
  PencilLine,
  ShieldCheck,
  TriangleAlert,
};
