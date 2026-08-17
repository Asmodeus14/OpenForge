import { createElement, type ReactNode } from 'react';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { cn } from '../cn';
import type { StatusDescriptor, Tone } from '../../lib/status';

const TONES: Record<Tone, string> = {
  neutral: 'bg-raised text-fg-muted border-line',
  accent: 'bg-accent-subtle text-accent-text border-accent-line',
  success: 'bg-success-subtle text-success-text border-success-line',
  warning: 'bg-warning-subtle text-warning-text border-warning-line',
  danger: 'bg-danger-subtle text-danger-text border-danger-line',
  info: 'bg-info-subtle text-info-text border-info-line',
};

export interface BadgeProps {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Pill geometry is reserved for status; everything else stays rectangular. */
  pill?: boolean;
}

export function Badge({ tone = 'neutral', icon, children, className, pill }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-0.5 text-meta font-medium whitespace-nowrap',
        pill ? 'rounded-full' : 'rounded-sm',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

function resolveIcon(name: string) {
  const icon = (Icons as unknown as Record<string, unknown>)[name];
  return typeof icon === 'function'
    ? (icon as React.ComponentType<LucideProps>)
    : Icons.Circle;
}

/**
 * Renders a `StatusDescriptor` from lib/status.
 *
 * Always pairs the tone with an icon and a text label, so status survives
 * greyscale, colour-blindness and screen readers.
 */
export function StatusPill({
  status,
  className,
  showIcon = true,
}: {
  status: StatusDescriptor;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <Badge tone={status.tone} className={className} pill
      icon={
        showIcon
          ? createElement(resolveIcon(status.icon), {
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
