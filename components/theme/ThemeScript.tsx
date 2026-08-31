/**
 * Applies the stored theme, and the environment phase, before first paint.
 *
 * Runs synchronously in <head>, ahead of React, so the page never flashes the
 * wrong theme. This is the one place a raw inline script is justified — doing
 * it in an effect guarantees a flash.
 *
 * The phase is resolved here for the same reason. The marketing environment is
 * a full-viewport gradient, so getting it wrong for even one frame is a bright
 * sky appearing behind a dark page. Because it is decided before hydration, the
 * environment needs no JavaScript at all to render correctly on first load —
 * the client provider only exists to advance it later.
 *
 * An explicit theme pins the phase to its endpoint: choosing dark means night,
 * choosing light means day. Only `system` follows the clock, which finally
 * gives that option a meaning beyond "read one media query".
 */
const script = `
(function () {
  var el = document.documentElement;
  var stored = null;
  try {
    stored = localStorage.getItem('openforge:theme');
  } catch (e) {
    // Storage unavailable (private mode). Fall back to the system default.
  }

  var system = false;
  try {
    system = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {}

  var dark = stored ? stored === 'dark' : system;
  el.classList.toggle('dark', dark);
  el.style.colorScheme = dark ? 'dark' : 'light';

  var phase;
  if (stored === 'dark') {
    phase = 'night';
  } else if (stored === 'light') {
    phase = 'day';
  } else {
    var h = new Date().getHours();
    // Wide day and night bands with short transitional edges, so most visitors
    // see a settled sky rather than a permanent golden hour.
    if (h >= 5 && h < 8) phase = 'dawn';
    else if (h >= 8 && h < 17) phase = 'day';
    else if (h >= 17 && h < 20) phase = 'dusk';
    else phase = 'night';

    // Following the system while it reports dark should not produce a bright
    // midday sky behind dark chrome.
    if (system && phase !== 'night') phase = 'dusk';
  }
  el.setAttribute('data-phase', phase);
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
