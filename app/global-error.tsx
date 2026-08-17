'use client';

import { useEffect } from 'react';

/**
 * Last-resort error boundary.
 *
 * This catches failures in the root layout itself, which means the theme
 * script, the fonts and the stylesheet may all have failed to apply. It
 * therefore renders its own `<html>` and `<body>` and styles itself inline —
 * anything relying on the design system could be exactly what is broken.
 *
 * Like every other failure surface here, it states plainly that nothing was
 * sent, because a render failure cannot have moved funds and that is the
 * first thing a user of a financial product needs to know.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#08090a',
          color: '#f5f5f7',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main style={{ maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            OpenForge could not start
          </h1>
          <p style={{ marginTop: '0.75rem', lineHeight: 1.6, color: '#a1a1aa' }}>
            The application failed to load. No transaction was sent as a result, and nothing
            on chain has changed.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: '1rem',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                fontSize: '0.8125rem',
                color: '#71717a',
              }}
            >
              Digest: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem',
              height: '2.5rem',
              padding: '0 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: '#6c5ce8',
              color: '#ffffff',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reload the application
          </button>
        </main>
      </body>
    </html>
  );
}
