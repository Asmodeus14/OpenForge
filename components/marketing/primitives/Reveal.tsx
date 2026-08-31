'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Reveals its children once, when they first enter the viewport.
 *
 * Deliberately not an animation library. The work is one class flip and a CSS
 * transition, which the compositor runs off the main thread — and the main
 * thread is busy during exactly the moment these fire, because the page is
 * still loading and hydrating. A `requestAnimationFrame`-driven library drops
 * frames under that load; a CSS transition does not.
 *
 * The reveal happens once. Content that re-animates every time it scrolls back
 * into view is the most tiring pattern on a long marketing page: the reader has
 * already seen it, and making them watch it arrive again is the site asserting
 * itself over its own content.
 *
 * Reduced motion is handled in CSS rather than here. The observer still runs
 * and still flips the flag, but `motion-reduce:transition-none` means the flip
 * is instantaneous — the content appears rather than travels. Branching on the
 * media query in the effect would mean calling `setState` synchronously during
 * it, which cascades a second render for every revealed block on the page.
 */
export function Reveal({
  children,
  as: As = 'div',
  delay = 0,
  y = 8,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  /** Stagger, in ms. Keep the total across a group under ~250ms. */
  delay?: number;
  /** Travel distance. Small on purpose — this is a settle, not an entrance. */
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // Fires slightly before the element is actually visible, so the reveal
      // has finished by the time it is centred and being read.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <As
      ref={ref}
      // The hook for the no-JS fallback in `RevealNoScript`. Without it, a
      // reader with scripting off gets a blank page, because the resting state
      // of this component is invisible.
      data-reveal=""
      data-shown={shown || undefined}
      style={
        {
          '--reveal-y': `${y}px`,
          transitionDelay: delay ? `${delay}ms` : undefined,
        } as React.CSSProperties
      }
      className={cn(
        'translate-y-(--reveal-y) opacity-0',
        'transition-[opacity,transform] duration-[400ms] ease-[var(--ease-out)]',
        'data-shown:translate-y-0 data-shown:opacity-100',
        'motion-reduce:transition-none',
        className,
      )}
    >
      {children}
    </As>
  );
}

/**
 * Makes every `Reveal` on the page visible when scripting is unavailable.
 *
 * Rendered once per page, not once per reveal. A marketing page whose entire
 * body is `opacity: 0` until an `IntersectionObserver` attaches is one blocked
 * script away from being a blank white screen, and that is also what a crawler
 * without a JS runtime sees.
 */
export function RevealNoScript() {
  return (
    <noscript>
      <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
    </noscript>
  );
}
