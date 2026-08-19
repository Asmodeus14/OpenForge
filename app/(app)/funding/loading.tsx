import { Page } from '@/components/ui/Layout';
import { Skeleton } from '@/components/ui/States';

/**
 * Funding is the heaviest server render in the app: it reads every escrow on
 * the factory, then each escrow's summary, milestones and token, then the
 * profiles of both parties. Without this the route committed to nothing until
 * all of it resolved, so navigation appeared to hang on the previous page.
 *
 * The skeleton mirrors the real layout — stat row, then rows carrying a title,
 * two people, an amount and a progress bar — so the content lands in place
 * rather than pushing the page around.
 */
export default function Loading() {
  return (
    <Page>
      <div className="pt-10 pb-8">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="mt-3 h-5 w-[30rem] max-w-full" />
      </div>

      <div className="border-t border-line py-9">
        <div className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2.5 h-7 w-20" />
              <Skeleton className="mt-2 h-3.5 w-28" />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-9">
        <Skeleton className="h-6 w-28" />

        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-t border-line py-7 first:mt-7">
            <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-6 w-64 max-w-full" />
                <Skeleton className="mt-2 h-4 w-full max-w-2xl" />
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="shrink-0">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="mt-2.5 h-7 w-28" />
                <Skeleton className="mt-1.5 h-3.5 w-36" />
              </div>
            </div>
            <Skeleton className="mt-5 h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </Page>
  );
}
