/**
 * Applies the stored theme before first paint.
 *
 * Runs synchronously in <head>, ahead of React, so the page never flashes
 * the wrong theme. This is the one place a raw inline script is justified —
 * doing it in an effect guarantees a flash.
 */
const script = `
(function () {
  try {
    var stored = localStorage.getItem('openforge:theme');
    var system = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : system;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {
    // Storage unavailable (private mode). Fall back to the system default.
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
