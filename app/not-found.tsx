import Link from 'next/link';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { Page } from '@/components/ui/Layout';

export default function NotFound() {
  return (
    <Page width="content">
      <div className="flex min-h-dvh flex-col justify-center py-16">
        <p className="text-micro font-medium uppercase tracking-wide text-fg-muted">404</p>
        <h1 className="mt-3 text-title text-fg">Page not found</h1>
        <p className="mt-3 text-body text-fg-secondary">
          This page does not exist. The link may be out of date, or the page may have been
          renamed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/overview" className={buttonClasses({ variant: 'primary' })}>
            Go to overview
          </Link>
          <Link href="/discover" className={buttonClasses({ variant: 'secondary' })}>
            Browse projects
          </Link>
        </div>
      </div>
    </Page>
  );
}
