'use client';

import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  value: string;
  label: string;
  /** Shown beside the label. Omit rather than rendering a zero. */
  count?: number;
  content: ReactNode;
}

/**
 * Horizontal tabs with full keyboard support (arrows, Home/End) via Radix.
 *
 * Underline rather than filled pills: this is navigation within a page, and
 * it should not compete visually with the page's primary action.
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
      <RadixTabs.List className="flex items-center gap-6 overflow-x-auto border-b border-line">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'relative -mb-px whitespace-nowrap border-b border-transparent py-3',
              'text-secondary font-medium text-fg-muted',
              'transition-colors duration-[var(--dur-fast)]',
              'hover:text-fg',
              'data-[state=active]:border-fg data-[state=active]:text-fg',
            )}
          >
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span className="ml-2 text-micro tabular-nums text-fg-muted">{item.count}</span>
            )}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((item) => (
        <RadixTabs.Content
          key={item.value}
          value={item.value}
          className="pt-8 focus-visible:outline-none"
        >
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
