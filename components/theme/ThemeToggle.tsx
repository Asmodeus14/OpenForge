'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTheme, type Theme } from './ThemeProvider';

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/**
 * Segmented theme control.
 *
 * Three explicit options rather than a two-state toggle, because "follow the
 * system" is a real preference and a toggle silently overrides it.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-line bg-subtle p-0.5',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex size-7 items-center justify-center rounded-sm',
              'transition-colors duration-[var(--dur-fast)]',
              selected
                ? 'bg-surface text-fg shadow-[var(--shadow-sm)]'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
