import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface TabItem {
  value: string;
  label: string;
  /** Shown as a subtle count beside the label. Omit rather than showing 0. */
  count?: number;
  content: ReactNode;
}

/**
 * Tabs with full keyboard support (arrow keys, Home/End) via Radix.
 *
 * Underline treatment rather than filled pills — it reads as navigation
 * within a page instead of competing with primary actions.
 */
export function Tabs({
  items,
  value,
  onValueChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RadixTabs.List className="flex items-center gap-1 border-b border-line overflow-x-auto">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'relative whitespace-nowrap px-3 py-2 text-secondary font-medium',
              'text-fg-muted transition-colors duration-[var(--dur-hover)]',
              'hover:text-fg',
              'data-[state=active]:text-fg',
              'after:absolute after:inset-x-2 after:-bottom-px after:h-px after:bg-transparent',
              'data-[state=active]:after:bg-accent',
            )}
          >
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span className="ml-1.5 text-meta text-fg-subtle tabular-nums">
                {item.count}
              </span>
            )}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((item) => (
        <RadixTabs.Content
          key={item.value}
          value={item.value}
          className="pt-4 focus-visible:outline-none"
        >
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
