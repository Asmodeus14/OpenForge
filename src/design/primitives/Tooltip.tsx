import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { cn } from '../cn';

/** Mount once near the app root. */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={300} skipDelayDuration={150}>
      {children}
    </RadixTooltip.Provider>
  );
}

/**
 * Supplementary hints only.
 *
 * A tooltip must never be the sole carrier of information — it is unreachable
 * on touch devices and easy to miss. Anything essential belongs in the visible
 * label or a `DisclosureNote`.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className={cn(
            'z-50 max-w-xs rounded-md border border-line bg-raised px-2.5 py-1.5',
            'text-meta text-fg shadow-[var(--shadow-popover)]',
            'data-[state=delayed-open]:animate-[of-fade-in_var(--dur-hover)_var(--ease-out)]',
            className,
          )}
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
