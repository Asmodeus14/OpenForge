import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';
import { IconButton } from './IconButton';

/**
 * Accessible modal dialog.
 *
 * Replaces the previous `Modal.tsx`, which had no portal, no Escape handler,
 * no focus trap and no `role="dialog"` — so keyboard and screen-reader users
 * could tab straight out of it into the page behind.
 *
 * Radix supplies focus trapping, focus restore, Escape, scroll lock and the
 * ARIA wiring; this file supplies the visual language.
 */

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Announced to assistive tech alongside the title. */
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Blocks dismissal by click-outside/Escape. Use while a tx is in flight. */
  dismissible?: boolean;
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
} as const;

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={dismissible ? onOpenChange : undefined}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/70',
            'data-[state=open]:animate-[of-fade-in_var(--dur-modal)_var(--ease-out)]',
          )}
        />
        <RadixDialog.Content
          onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
          onPointerDownOutside={(e) => !dismissible && e.preventDefault()}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
            'flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden',
            'rounded-xl border border-line bg-surface shadow-[var(--shadow-dialog)]',
            'data-[state=open]:animate-[of-dialog-in_var(--dur-modal)_var(--ease-out)]',
            SIZES[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
            <div className="min-w-0">
              <RadixDialog.Title className="text-heading text-fg">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-1 text-secondary text-fg-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            {dismissible && (
              <RadixDialog.Close asChild>
                <IconButton
                  label="Close"
                  size="sm"
                  icon={<X className="size-4" aria-hidden />}
                  className="-mr-1.5 -mt-1"
                />
              </RadixDialog.Close>
            )}
          </div>

          {children && (
            <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
          )}

          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-line bg-sunken px-5 py-3">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
