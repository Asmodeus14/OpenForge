'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button, IconButton } from './Button';

/**
 * Modal dialog.
 *
 * Radix supplies focus trapping, focus restore, Escape, scroll lock and the
 * ARIA wiring; this file supplies the visual language. Building those by
 * hand is where dialog accessibility usually breaks.
 */

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
} as const;

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  /** Blocks dismissal. Use while a transaction is in flight. */
  dismissible?: boolean;
}

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
            'fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-[2px] dark:bg-black/60',
            'data-[state=open]:animate-[of-fade-in_var(--dur-base)_var(--ease-out)]',
            'data-[state=closed]:animate-[of-fade-out_var(--dur-fast)_var(--ease-out)]',
          )}
        />
        <RadixDialog.Content
          onEscapeKeyDown={(event) => !dismissible && event.preventDefault()}
          onPointerDownOutside={(event) => !dismissible && event.preventDefault()}
          className={cn(
            'fixed left-1/2 top-1/2 z-[var(--z-overlay)] w-[calc(100vw-2rem)]',
            '-translate-x-1/2 -translate-y-1/2',
            'flex max-h-[calc(100dvh-3rem)] flex-col overflow-hidden',
            'rounded-xl border border-line bg-elevated shadow-[var(--shadow-overlay)]',
            'data-[state=open]:animate-[of-overlay-in_var(--dur-base)_var(--ease-out)]',
            'data-[state=closed]:animate-[of-overlay-out_var(--dur-fast)_var(--ease-out)]',
            SIZES[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
            <div className="min-w-0">
              <RadixDialog.Title className="text-section text-fg">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-1.5 text-secondary text-fg-secondary">
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
                  className="-mr-2 -mt-1"
                />
              </RadixDialog.Close>
            )}
          </div>

          {children && <div className="flex-1 overflow-y-auto px-6 pb-5">{children}</div>}

          {footer && (
            <div className="flex items-center justify-end gap-2.5 border-t border-line bg-subtle px-6 py-4">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** State the consequence. Do not stop at "Are you sure?". */
  description: string;
  /** Names the consequence, e.g. "Delete room". Never "OK" or "Continue". */
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

/**
 * Confirmation for irreversible non-financial actions.
 *
 * Financial actions do not use this — they go through `TransactionFlow`,
 * which additionally shows amounts, recipients, fees and the resulting
 * transaction hash.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  destructive,
  loading,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
