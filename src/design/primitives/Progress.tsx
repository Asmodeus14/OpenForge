import { cn } from '../cn';
import type { Tone } from '../../lib/status';

const TONES: Record<Tone, string> = {
  neutral: 'bg-fg-subtle',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

/**
 * A determinate progress bar.
 *
 * `label` is required: a bare bar tells a screen-reader user nothing, and
 * tells a sighted user only a ratio without units. Progress in this product
 * usually means money or milestones, so it must be named.
 */
export function Progress({
  value,
  max,
  label,
  tone = 'accent',
  showValue = true,
  className,
}: {
  value: number;
  max: number;
  label: string;
  tone?: Tone;
  showValue?: boolean;
  className?: string;
}) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100));

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {showValue && (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-meta text-fg-muted">{label}</span>
          <span className="text-meta tabular-nums text-fg">
            {value} / {max}
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-raised"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-[var(--dur-page)]',
            TONES[tone],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
