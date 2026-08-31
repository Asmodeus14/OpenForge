/**
 * The horizon: two mountain ranges, birds by day, village lights by night.
 *
 * Terrain is what gives the sky a scale. Without it a gradient is just a
 * coloured backdrop; with a ridgeline behind it and cloud in front of its base,
 * the same gradient reads as distance.
 *
 * Drawn as SVG paths rather than as an image for the same reason as everything
 * else in this environment — it recolours through the `--env-*` palette, so the
 * ranges move from hazy blue-grey at noon to near-black silhouettes at
 * midnight without a second asset existing.
 *
 * `preserveAspectRatio="xMidYMax slice"` is deliberate: the ridge should crop
 * as the viewport narrows, not squash. A stretched mountain is instantly
 * readable as fake.
 */

/** Far range. Low contrast, sits in haze, reads as distance. */
const FAR =
  'M0 176 L96 118 L150 148 L228 74 L302 132 L368 96 L436 150 L520 88 L596 142 L672 108 L744 160 L820 120 L900 168 L960 140 L1200 180 L1200 260 L0 260 Z';

/** Near range. Carries the silhouette and the lit faces. */
const NEAR =
  'M0 240 L88 196 L164 224 L260 150 L316 186 L404 122 L470 176 L560 138 L642 192 L716 160 L800 206 L884 168 L972 214 L1064 178 L1140 216 L1200 198 L1200 260 L0 260 Z';

/** Sunlit faces on the near range — the west side of the three tallest peaks. */
const LIT = 'M404 122 L470 176 L436 176 Z M560 138 L620 180 L588 180 Z M260 150 L316 186 L286 186 Z';

/** Windows in the valley. Fixed positions so they do not shimmer on re-render. */
const VILLAGE: [number, number][] = [
  [318, 232], [332, 236], [345, 231], [356, 238], [372, 234],
  [598, 240], [612, 236], [626, 241], [640, 237],
  [864, 234], [878, 239], [892, 235], [906, 240], [920, 236],
];

/** Three birds, small and off to one side. Present, not decorative. */
const BIRDS: [number, number, number][] = [
  [148, 62, 1], [186, 48, 0.8], [214, 70, 0.65],
];

export function Terrain() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 260"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-x-0 bottom-0 h-[46%] w-full"
    >
      <g style={{ fill: 'var(--env-peak-far)', opacity: 0.75 }}>
        <path d={FAR} />
      </g>

      <g style={{ fill: 'var(--env-peak-near)' }}>
        <path d={NEAR} />
      </g>

      <g style={{ fill: 'var(--env-peak-lit)', opacity: 0.45 }}>
        <path d={LIT} />
      </g>

      {/* Warm windows. Blurred slightly so they read as light rather than as
          pixels, and gated on `--env-village` so they are absent at noon. */}
      <g style={{ opacity: 'var(--env-village)' }} filter="url(#of-village-glow)">
        {VILLAGE.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} fill="#ffcf8f" />
        ))}
      </g>

      <g
        style={{ opacity: 'var(--env-birds)' }}
        stroke="var(--env-peak-near)"
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      >
        {BIRDS.map(([x, y, s]) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y} q ${4 * s} ${-3 * s} ${8 * s} 0 q ${4 * s} ${-3 * s} ${8 * s} 0`}
          />
        ))}
      </g>

      <defs>
        <filter id="of-village-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation={1.6} />
        </filter>
      </defs>
    </svg>
  );
}
