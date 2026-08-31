'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/components/theme/ThemeProvider';

/**
 * The transient feedback layer.
 *
 * `sonner` was in `package.json` for a long time without ever being imported,
 * which left the product with no way to confirm anything quietly. Every
 * outcome had to become either a dialog — too heavy for "that worked" — or an
 * inline panel, which only works if the user happens to be looking at the
 * place it renders. Several actions simply completed in silence.
 *
 * What belongs here is narrow. A toast is right when the thing the user acted
 * on *disappears as a result*, taking its own label with it: leaving a
 * conversation, deleting a room. It is wrong for anything the user can already
 * see the result of — a copied address (the icon becomes a tick), a deleted
 * message (it vanishes from the transcript in front of them) — and wrong for
 * errors, which need to persist and carry their technical detail. Those stay
 * with `ErrorState`.
 *
 * Nothing involving money is announced here. Those go through
 * `TransactionFlow`, which shows amounts, recipients and a hash, and which the
 * user must dismiss deliberately.
 */
export function Toaster() {
  const { resolved } = useTheme();

  return (
    <SonnerToaster
      // The resolved value, never the raw preference: `system` is not a colour
      // and Sonner would fall back to light while the app rendered dark.
      theme={resolved}
      position="bottom-right"
      // Clear of the fixed mobile tab bar and the home indicator beneath it.
      // The desktop offset is the ordinary page gutter.
      offset={{ bottom: '1.5rem', right: '1.5rem' }}
      mobileOffset={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))', right: '1rem', left: '1rem' }}
      gap={10}
      duration={5000}
      // Sonner ships a z-index in the thousands; the product keeps its layers
      // in one place so an overlay can never be shuffled behind a toast.
      style={{ zIndex: 'var(--z-toast)' } as React.CSSProperties}
      // Sonner's default tick / cross are kept deliberately. Status in this
      // product never travels on colour alone, and a green toast with no icon
      // would be the one place it did.
      toastOptions={{
        // Sonner's own palette is replaced wholesale rather than themed around:
        // its defaults are near-white and near-black, which read as a foreign
        // surface next to `--elevated`.
        classNames: {
          toast: [
            'rounded-lg border border-line bg-elevated',
            'shadow-[var(--shadow-lg)]',
            'font-sans text-secondary text-fg',
          ].join(' '),
          title: 'text-secondary font-medium text-fg',
          description: 'text-meta text-fg-secondary',
          // The shared button material, not a hand-mixed copy of it. These
          // carried `rounded-md bg-accent` inside a toast that had already
          // moved to `rounded-lg` — the buttons were visibly out of step with
          // their own container, and with every other button in the product.
          actionButton:
            'of-btn-primary rounded-lg px-2.5 py-1 text-micro font-medium text-fg-on-accent',
          cancelButton:
            'of-btn-face rounded-lg px-2.5 py-1 text-micro font-medium text-fg-secondary',
          closeButton: 'border-line bg-elevated text-fg-muted hover:text-fg',
          // Semantic tones borrow the same subtle/line pairs every other status
          // surface uses, so a success toast and a success badge are the same
          // green rather than two greens that nearly match.
          success: 'border-success-line bg-success-subtle text-fg',
          error: 'border-danger-line bg-danger-subtle text-fg',
          warning: 'border-warning-line bg-warning-subtle text-fg',
          info: 'border-info-line bg-info-subtle text-fg',
        },
      }}
    />
  );
}
