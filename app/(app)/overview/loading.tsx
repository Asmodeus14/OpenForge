import { Page } from '@/components/ui/Layout';
import { Skeleton } from '@/components/ui/States';

/**
 * Route-level loading UI.
 *
 * Mirrors the real Overview layout closely enough that nothing shifts when
 * content arrives — a skeleton that does not match its page is just a more
 * elaborate spinner.
 */
export default function Loading() {
  return (
    <Page>
      <div className="pt-10 pb-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 h-5 w-80" />
      </div>

      <dl className="grid grid-cols-2 gap-8 border-t border-line py-8 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="mt-2.5 h-7 w-14" />
          </div>
        ))}
      </dl>

      <div className="border-t border-line py-10">
        <Skeleton className="h-6 w-40" />
        <div className="mt-6 flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </Page>
  );
}
