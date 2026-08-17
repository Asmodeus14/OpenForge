'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

/**
 * Message composer.
 *
 * Enter sends, Shift+Enter adds a line — the convention every chat client
 * shares, and violating it is the fastest way to make someone send half a
 * sentence.
 *
 * Typing notifications are throttled to one every few seconds. Emitting on
 * every keystroke floods the socket and tells the other party nothing extra.
 */

const TYPING_INTERVAL_MS = 3_000;
const TYPING_IDLE_MS = 2_000;

export function Composer({
  disabled,
  placeholder,
  onSend,
  onTyping,
  onTypingStop,
}: {
  disabled?: boolean;
  placeholder: string;
  onSend: (content: string) => void;
  onTyping?: () => void;
  onTypingStop?: () => void;
}) {
  const [value, setValue] = useState('');
  const lastTypingAt = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the pending "stopped typing" signal if the composer unmounts, so a
  // room switch does not fire it against the room just left.
  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    [],
  );

  function send() {
    const content = value.trim();
    if (!content || disabled) return;
    onSend(content);
    setValue('');
    lastTypingAt.current = 0;
    onTypingStop?.();
  }

  function noteTyping() {
    const now = Date.now();
    if (now - lastTypingAt.current > TYPING_INTERVAL_MS) {
      lastTypingAt.current = now;
      onTyping?.();
    }
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      lastTypingAt.current = 0;
      onTypingStop?.();
    }, TYPING_IDLE_MS);
  }

  return (
    <div className="flex items-end gap-2 border-t border-line bg-canvas px-4 py-3">
      <label htmlFor="chat-composer" className="sr-only">
        Message
      </label>
      <textarea
        id="chat-composer"
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => {
          setValue(event.target.value);
          noteTyping();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
        className={cn(
          'max-h-40 min-h-10 flex-1 resize-y rounded-md border border-line bg-surface px-3 py-2.5',
          'text-body text-fg placeholder:text-fg-muted',
          'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-subtle',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      />
      <IconButton
        label="Send message"
        variant="primary"
        onClick={send}
        disabled={disabled || !value.trim()}
        icon={<SendHorizontal className="size-4" aria-hidden />}
      />
    </div>
  );
}
