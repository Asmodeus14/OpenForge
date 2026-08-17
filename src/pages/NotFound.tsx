import { useLocation, useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button, EmptyState } from '../design/primitives';

/**
 * 404. The application previously had no catch-all route, so a mistyped or
 * stale URL rendered a blank page with no way back.
 */
export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <EmptyState
        icon={<FileQuestion className="size-5" aria-hidden />}
        title="Page not found"
        description={`Nothing exists at ${location.pathname}. The link may be out of date, or the page may have been renamed.`}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={() => navigate('/overview')}>
              Go to overview
            </Button>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </div>
        }
      />
    </div>
  );
}
