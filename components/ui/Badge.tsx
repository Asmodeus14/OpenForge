import { createElement, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { STATUS_ICONS } from '@/components/ui/statusIcons';
import type { StatusDescriptor, Tone } from '@/lib/status';

const TONES: Record<Tone, string> = {
  neutral: 'bg-subtle text-fg-secondary border-line',
  accent: 'bg-accent-subtle text-accent-text border-accent-line',
  success: 'bg-success-subtle text-success-text border-success-line',
  warning: 'bg-warning-subtle text-warning-text border-warning-line',
  danger: 'bg-danger-subtle text-danger-text border-danger-line',
  info: 'bg-info-subtle text-info-text border-info-line',
};

export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-micro font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * Renders a status from `lib/status`.
 *
 * Always shows an icon and a word alongside the tone, so status survives
 * greyscale, colour-blindness and screen readers. Colour never carries the
 * meaning on its own.
 */
export function StatusPill({
  status,
  showIcon = true,
  className,
}: {
  status: StatusDescriptor;
  showIcon?: boolean;
  className?: string;
}) {
  return (
    <Badge
      tone={status.tone}
      className={className}
      icon={
        showIcon
          ? createElement(STATUS_ICONS[status.icon], {
              className: 'size-3 shrink-0',
              'aria-hidden': true,
            })
          : undefined
      }
    >
      {status.label}
    </Badge>
  );
}
