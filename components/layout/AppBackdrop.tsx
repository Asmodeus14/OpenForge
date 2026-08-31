/**
 * A trace of the environment, behind the application.
 *
 * The app chrome was rebuilt out of the same glass as the marketing site and
 * looked identical to what it replaced — because glass over a flat white page
 * has nothing to refract. A material that reveals what is behind it needs
 * something behind it.
 *
 * So this is the sky, reduced to almost nothing: one accent wash at the top of
 * the page, tinted by the current phase, sitting under everything. Enough for
 * the top bar to read as a pane of glass rather than a grey strip, and far too
 * faint to compete with a table of figures.
 *
 * It is fixed rather than scrolled. The wash marks the top of the *viewport*,
 * where the chrome is; scrolling it away would take the glass effect with it
 * halfway down a long page.
 */
export function AppBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-96">
      {/* Two offset washes rather than one centred blob: a single radial
          gradient reads as a spotlight behind the logo, two overlapping ones
          read as light with no obvious source. */}
      <div
        className="absolute inset-0 opacity-70 transition-[background] duration-[var(--env-transition)] ease-in-out"
        style={{
          background:
            'radial-gradient(60% 100% at 15% 0%, var(--accent-subtle), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-60 transition-[background] duration-[var(--env-transition)] ease-in-out"
        style={{
          background:
            'radial-gradient(50% 90% at 80% 0%, var(--env-glow), transparent 72%)',
        }}
      />
    </div>
  );
}
