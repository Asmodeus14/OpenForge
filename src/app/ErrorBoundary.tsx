import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../design/primitives';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level crash boundary.
 *
 * The previous version told every user "The chat component encountered an
 * error" regardless of which page had actually failed, and offered only a
 * full page reload. This one names nothing it cannot know, keeps the detail
 * available but collapsed, and offers recovery without discarding the app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in render:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6">
          <h1 className="text-heading text-fg">This page stopped working</h1>
          <p className="mt-2 text-secondary text-fg-muted">
            Something in the interface failed unexpectedly. No transaction was sent as a
            result of this error, and nothing on chain has changed.
          </p>

          <details className="mt-4">
            <summary className="cursor-pointer text-meta text-fg-subtle hover:text-fg-muted">
              Technical details
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-sm bg-sunken p-2 text-code text-fg-subtle">
              {error.message}
            </pre>
          </details>

          <div className="mt-5 flex gap-2">
            <Button variant="primary" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
            <Button variant="secondary" onClick={() => window.location.assign('/overview')}>
              Go to overview
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
