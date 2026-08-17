import { Page } from '@/components/ui/Layout';
import { Skeleton } from '@/components/ui/States';

/**
 * Discover reads the chain and then IPFS on the server, so its first paint
 * genuinely waits on the network. The skeleton mirrors the real grid so
 * nothing shifts when the projects land.
 */
export default function Loading() {
  return (
    <Page>
      <div className="pt-10 pb-8">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      </div>

      <div className="grid gap-5 border-t border-line py-10 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-lg" />
        ))}
      </div>
    </Page>
  );
}
