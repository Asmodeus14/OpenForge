'use client';

import { Clock, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTheme } from '@/components/theme/ThemeProvider';

/**
 * Day or night, as a switch you slide.
 *
 * The thumb travels on `cubic-bezier(0.34, 1.35, 0.64, 1)` — a back-out curve
 * that overshoots slightly and settles. Bounce is wrong for most interface
 * motion, but this is the exception the rule allows for: it is a playful,
 * occasional control, and the overshoot is what makes a switch feel thrown
 * rather than repositioned. The reference curve was `1.56`; that reads as a
 * toy at this size, so the overshoot is tuned down.
 *
 * The thumb carries the light. It is the sun or the moon, it glows in the
 * colour of the sky it selects, and the glow is on the thumb rather than the
 * track so the track stays a piece of glass rather than becoming a lamp.
 *
 * Two positions, because a switch has two. `system` — follow the local clock —
 * lives on the small button beside it, and the switch shows where the clock has
 * currently put you.
 */

const EASE_BACK = 'cubic-bezier(0.34, 1.35, 0.64, 1)';

export function SkyToggle({ className }: { className?: string }) {
  const { theme, phase, setTheme } = useTheme();

  const auto = theme === 'system';
  // While following the clock the switch is a readout, not a stale position.
  const night = auto ? phase === 'night' || phase === 'dusk' : theme === 'dark';

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={night}
        aria-label={night ? 'Night. Switch to daytime.' : 'Daytime. Switch to night.'}
        title={night ? 'Switch to daytime' : 'Switch to night'}
        onClick={() => setTheme(night ? 'light' : 'dark')}
        className={cn(
          'of-glass relative inline-flex h-9 w-[3.75rem] shrink-0 items-center rounded-full px-1',
          'transition-[background-color] duration-[var(--dur-base)]',
          // The press is on the whole control; the thumb travel is separate.
          'active:scale-[0.97] motion-safe:transition-transform',
        )}
      >
        {/* Rail icons. The one the thumb is covering fades out, so the visible
            icon is always the state you would move to. */}
        <Sun
          className={cn(
            'pointer-events-none absolute left-[0.5rem] size-3.5 text-warning-text',
            'transition-opacity duration-[var(--dur-base)]',
            night ? 'opacity-70' : 'opacity-0',
          )}
          aria-hidden
        />
        <Moon
          className={cn(
            'pointer-events-none absolute right-[0.5rem] size-3.5 text-accent-text',
            'transition-opacity duration-[var(--dur-base)]',
            night ? 'opacity-0' : 'opacity-70',
          )}
          aria-hidden
        />

        <span
          className={cn(
            'relative z-10 flex size-7 items-center justify-center rounded-full',
            'motion-reduce:transition-none',
          )}
          style={{
            transform: night ? 'translateX(1.5rem)' : 'translateX(0)',
            transition: `transform 420ms ${EASE_BACK}, background 600ms ease, box-shadow 600ms ease`,
            background: night
              ? 'linear-gradient(145deg, #8b7bf0, #5b4bd6)'
              : 'linear-gradient(145deg, #ffd27a, #f5a524)',
            boxShadow: night
              ? '0 0 0 1px rgba(139,123,240,0.5), 0 2px 10px -1px rgba(91,75,214,0.65), inset 0 1px 0 rgba(255,255,255,0.35)'
              : '0 0 0 1px rgba(245,165,36,0.45), 0 2px 10px -1px rgba(245,165,36,0.6), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          {/* Both glyphs are mounted and cross-fade with a quarter turn — a
              swap would pop, and rotation is what sells one becoming the
              other rather than two icons trading places. */}
          <Sun
            className={cn(
              'absolute size-3.5 text-white transition-[opacity,transform] duration-[var(--dur-base)]',
              night ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100',
            )}
            aria-hidden
          />
          <Moon
            className={cn(
              'absolute size-3.5 text-white transition-[opacity,transform] duration-[var(--dur-base)]',
              night ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0',
            )}
            aria-hidden
          />
        </span>
      </button>

      {/* Hand the sky back to the clock. Highlighted while it is in charge. */}
      <button
        type="button"
        aria-pressed={auto}
        aria-label="Follow my local time"
        title="Follow my local time"
        onClick={() => setTheme(auto ? (night ? 'dark' : 'light') : 'system')}
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-full',
          'transition-colors duration-[var(--dur-fast)] active:scale-[0.96]',
          auto
            ? 'bg-accent-subtle text-accent-text'
            : 'text-fg-muted hover:bg-subtle hover:text-fg',
        )}
      >
        <Clock className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
