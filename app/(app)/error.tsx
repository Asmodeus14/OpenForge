'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { Page } from '@/components/ui/Layout';

/**
 * Route-level error boundary.
 *
 * Says what is known and no more. It deliberately does not speculate about
 * the cause, and it states plainly that nothing was sent — because a render
 * failure genuinely cannot have moved funds, and that is the first thing a
 * user of a financial product wants to know.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <Page width="content">
      <div className="flex min-h-[60dvh] flex-col justify-center py-16">
        <h1 className="text-title text-fg">This page stopped working</h1>
        <p className="mt-3 text-body text-fg-secondary">
          Something in the interface failed unexpectedly. No transaction was sent as a
          result, and nothing on chain has changed.
        </p>

        <details className="mt-6 group rounded-md border border-line bg-subtle">
          <summary className="cursor-pointer list-none px-4 py-3 text-meta text-fg-muted transition-colors hover:text-fg-secondary">
            View technical details
          </summary>
          <pre className="overflow-x-auto border-t border-line px-4 py-3 text-code text-fg-muted">
            {error.message}
            {error.digest ? `\n\nDigest: ${error.digest}` : ''}
          </pre>
        </details>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <Link href="/overview" className={buttonClasses({ variant: 'secondary' })}>
            Go to overview
          </Link>
        </div>
      </div>
    </Page>
  );
}
