import { cn } from '@/lib/cn';

/**
 * The OpenForge mark.
 *
 * Rendered as a CSS mask over `currentColor` rather than as an `<img>`, so a
 * single asset is correct in both themes and inherits whatever colour its
 * context sets. The committed `openforge.svg` could not do this: its fill was
 * hardcoded `#000000`, which is invisible on a dark background.
 *
 * The asset is generated from the brand sheet by `scripts/build-logo.js`.
 * Its intrinsic ratio is 5:6, which the wrapper preserves so the mark never
 * distorts at any size.
 *
 * No `'use client'` — Server Components render the header and the marketing
 * pages, and anything exported from a client module is unreachable to them.
 */
export function LogoMark({
  className,
  title = 'OpenForge',
}: {
  className?: string;
  /** Set to `null` when an adjacent wordmark already names the product. */
  title?: string | null;
}) {
  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      className={cn('inline-block aspect-[5/6] shrink-0 bg-current', className)}
      style={{
        maskImage: 'url(/logo-mark.png)',
        WebkitMaskImage: 'url(/logo-mark.png)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}

/**
 * Mark plus wordmark, as the brand sheet's horizontal lockup.
 *
 * The wordmark is set in the product's own typeface rather than baked into an
 * image, so it stays crisp, selectable and searchable, and matches the rest of
 * the interface exactly.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-fg', className)}>
      <LogoMark className="h-6" title={null} />
      <span className="text-body font-semibold tracking-tight">OpenForge</span>
    </span>
  );
}
