'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PROJECT_LIMITS } from '@/lib/project';

/**
 * Tag entry.
 *
 * One implementation. The previous codebase had four separate ones, three of
 * which independently rendered the string "No tags added yet".
 */
export function TagInput({
  tags,
  onChange,
  label = 'Tags',
  hint,
  error,
  max = PROJECT_LIMITS.tagsMax,
  itemLabel = 'tag',
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  hint?: string;
  error?: string;
  max?: number;
  /** Noun used in the placeholder, e.g. "skill". */
  itemLabel?: string;
}) {
  const [draft, setDraft] = useState('');
  // Generated, not hardcoded: two of these on one page would otherwise share
  // a DOM id, and every label would point at whichever rendered first.
  const id = useId();
  const full = tags.length >= max;

  function commit() {
    const value = draft.trim().slice(0, PROJECT_LIMITS.tagMax);
    if (!value || full) return;
    // Case-insensitive dedupe, so "React" and "react" aren't both added.
    if (tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...tags, value]);
    setDraft('');
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit();
    }
    // Backspace on an empty field removes the last tag — the behaviour
    // people expect from every other tag field they have used.
    if (event.key === 'Backspace' && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-secondary font-medium text-fg">
        {label}
      </label>

      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-md border bg-surface px-2 py-2',
          'shadow-[var(--shadow-sm)] transition-colors duration-[var(--dur-fast)]',
          'focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-subtle',
          error ? 'border-danger-line' : 'border-line',
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-sm border border-line bg-subtle py-0.5 pl-2 pr-1 text-meta text-fg"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="rounded-xs text-fg-muted transition-colors hover:text-fg"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}

        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          disabled={full}
          maxLength={PROJECT_LIMITS.tagMax}
          placeholder={
            full ? `Maximum ${max} ${itemLabel}s` : `Add a ${itemLabel} and press Enter`
          }
          aria-describedby={`${id}-hint`}
          className="min-w-40 flex-1 bg-transparent px-1 py-0.5 text-body text-fg placeholder:text-fg-muted focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      <p
        id={`${id}-hint`}
        role={error ? 'alert' : undefined}
        className={cn('text-meta', error ? 'text-danger-text' : 'text-fg-muted')}
      >
        {error ?? hint ?? `${tags.length} of ${max}. Press Enter or comma to add.`}
      </p>
    </div>
  );
}
