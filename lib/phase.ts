export type Phase = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * Which point in the day the environment is drawn at.
 *
 * An explicit theme pins the phase to an endpoint — choosing dark means night,
 * choosing light means day. Only `system` follows the clock, which is what
 * finally gives that option a meaning beyond reading one media query.
 *
 * ⚠ This logic is duplicated, on purpose, inside the inline string in
 * `components/theme/ThemeScript.tsx`. That script has to run before React
 * exists, so it cannot import from here. The two must stay in step: if the
 * bands below change, change them there too, or the sky will shift on
 * hydration.
 */
export function resolvePhase(
  theme: 'light' | 'dark' | 'system',
  systemPrefersDark: boolean,
  now: Date = new Date(),
): Phase {
  if (theme === 'dark') return 'night';
  if (theme === 'light') return 'day';

  const hour = now.getHours();

  // Wide day and night bands with short transitional edges, so most visitors
  // see a settled sky rather than a permanent golden hour.
  let phase: Phase;
  if (hour >= 5 && hour < 8) phase = 'dawn';
  else if (hour >= 8 && hour < 17) phase = 'day';
  else if (hour >= 17 && hour < 20) phase = 'dusk';
  else phase = 'night';

  // Following a system that reports dark should not produce a bright midday
  // sky behind dark chrome.
  if (systemPrefersDark && phase !== 'night') phase = 'dusk';

  return phase;
}
