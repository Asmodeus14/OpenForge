import { cn } from '@/lib/cn';
import { Terrain } from './Terrain';

/**
 * The sky the marketing site sits in.
 *
 * A Server Component with no JavaScript of its own. Every value it paints with
 * comes from the `--env-*` palette, and `ThemeScript` has already stamped
 * `data-phase` on <html> before this reaches the screen — so the correct sky
 * renders on the first frame, with no hydration and no flash, and moving
 * between phases later is a set of custom properties interpolating.
 *
 * Nothing here is an image. The whole environment costs zero network bytes and
 * is resolution-independent, which is worth more than photographic detail at
 * the scale it renders: a full-bleed backdrop that content sits on top of.
 */

/**
 * A deterministic star field.
 *
 * Generated as one `box-shadow` list rather than hundreds of elements: it is a
 * single paint on a single node, and the browser never has to lay out 160 divs
 * that will never move. The positions come from a seeded PRNG so the sky is
 * identical on the server and the client — `Math.random()` here would be a
 * hydration mismatch and a different sky on every navigation.
 */
function starField(count: number, seed: number): string {
  let state = seed;
  const random = () => {
    // xorshift32 — small, fast, and stable across environments.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };

  const stars: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = (random() * 100).toFixed(3);
    // Squared so stars crowd toward the top of the sky and thin out near the
    // horizon, the way haze actually thins them.
    const y = (random() * random() * 78).toFixed(3);
    const opacity = (0.35 + random() * 0.65).toFixed(2);
    stars.push(`${x}vw ${y}vh 0 0 rgba(255,255,255,${opacity})`);
  }
  return stars.join(',');
}

const STARS_SMALL = starField(140, 0x9e3779b9);
const STARS_LARGE = starField(28, 0x85ebca6b);

export function Environment({
  className,
  /**
   * The ridgeline. On by default for marketing, off inside the application:
   * a mountain range behind a table of figures is scenery competing with the
   * thing the reader is trying to parse, and the sky alone carries the same
   * sense of place at a fraction of the visual weight.
   */
  terrain = true,
  /**
   * Dims the whole environment. The application needs the atmosphere present
   * but recessive — panels sit on it and must stay legible, which a sky at
   * full strength works against.
   */
  intensity = 1,
}: {
  className?: string;
  terrain?: boolean;
  intensity?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        // Every layer inside animates its colour on this one duration, so a
        // phase change reads as one environment changing rather than five
        // things changing at slightly different times.
        '[&_*]:transition-[background,opacity,box-shadow,filter]',
        '[&_*]:duration-[var(--env-transition)] [&_*]:ease-in-out',
        className,
      )}
      style={intensity === 1 ? undefined : { opacity: intensity }}
    >
      {/* Sky. Three stops rather than two — a linear gradient between zenith
          and horizon reads as a backdrop; the mid stop is what makes it read
          as atmosphere with depth in it. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, var(--env-zenith) 0%, var(--env-mid) 48%, var(--env-horizon) 100%)',
        }}
      />

      {/* Stars. Two sizes at different opacities; the field is painted even in
          daylight and simply carries `--env-star: 0`, so dusk fades them in
          rather than mounting them. */}
      <div className="absolute inset-0" style={{ opacity: 'var(--env-star)' }}>
        <div
          className="absolute left-0 top-0 size-px rounded-full"
          style={{ boxShadow: STARS_SMALL }}
        />
        <div
          className="absolute left-0 top-0 rounded-full"
          style={{ height: '2px', width: '2px', boxShadow: STARS_LARGE, filter: 'blur(0.3px)' }}
        />
      </div>

      {/* The sun or the moon. One element: it is the same body, and moving and
          recolouring it is what sells the day passing rather than two objects
          swapping places. */}
      <div
        className="absolute rounded-full"
        style={{
          left: 'var(--env-glow-x)',
          top: 'var(--env-glow-y)',
          height: 'clamp(3.5rem, 6vw, 6rem)',
          width: 'clamp(3.5rem, 6vw, 6rem)',
          transform: 'translate(-50%, -50%)',
          background: 'var(--env-body)',
          boxShadow: '0 0 6rem 3rem var(--env-body-glow), 0 0 14rem 7rem var(--env-body-glow)',
        }}
      />

      {/* Atmospheric wash from the light source, well beyond the body itself.
          This is most of what makes the sky feel lit rather than printed. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at var(--env-glow-x) var(--env-glow-y), var(--env-glow), transparent 70%)',
        }}
      />

      {/* Terrain sits behind the cloud sea: the ridge is what gives the sky a
          scale, and cloud crossing the base of a mountain is what sells the
          distance. Reversing these two reads as a sticker on a gradient. */}
      {terrain && <Terrain />}

      <Clouds />

      {/* Horizon haze, and a fade into the page beneath. Without the second
          layer the sky ends on a hard line, which immediately reads as a
          background image rather than as air. */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--env-haze))',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--canvas))' }}
      />

      <Grain />
    </div>
  );
}

/**
 * Clouds.
 *
 * Fractal noise, thresholded into soft masses. The filter is expensive to
 * rasterise, so it runs on two fixed-size layers that are then only ever
 * translated and faded — never re-filtered. Animating the turbulence itself
 * would be a per-frame re-rasterisation of a full-viewport surface, which is
 * how atmospheric backdrops end up costing more than the entire application.
 */
function Clouds() {
  return (
    <>
      <svg aria-hidden className="absolute size-0">
        <defs>
          <filter id="of-cloud" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.014"
              numOctaves={4}
              seed={7}
              result="noise"
            />
            {/* Steepening the alpha ramp turns a grey fog into distinct masses
                with soft edges. Without it the noise reads as television snow. */}
            <feComponentTransfer in="noise" result="shaped">
              <feFuncA type="gamma" exponent={7} amplitude={1.6} offset={-0.12} />
            </feComponentTransfer>
            <feGaussianBlur in="shaped" stdDeviation={7} />
          </filter>
        </defs>
      </svg>

      {/* High wisps. Thin, and well above the ridgeline. */}
      <div
        className="absolute inset-x-[-10%] top-[4%] h-[26%] opacity-70"
        style={{
          filter: 'url(#of-cloud)',
          background: 'var(--env-cloud)',
          maskImage: 'linear-gradient(to bottom, transparent, black 40%, transparent)',
        }}
      />

      {/* Shadowed underside, sitting between the two ranges. */}
      <div
        className="absolute inset-x-[-16%] top-[36%] h-[26%] opacity-60"
        style={{
          filter: 'url(#of-cloud)',
          background: 'var(--env-cloud-shadow)',
          maskImage: 'linear-gradient(to bottom, transparent, black 45%, transparent)',
        }}
      />

      {/* The cloud sea. Dense, low, and crossing the base of the mountains —
          this is the layer that makes the peaks read as emerging from weather
          rather than as a shape pasted onto a gradient. */}
      <div
        className="absolute inset-x-[-12%] bottom-[2%] h-[34%] opacity-95"
        style={{
          filter: 'url(#of-cloud)',
          background: 'var(--env-cloud)',
          maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 80%, transparent)',
        }}
      />
    </>
  );
}

/**
 * Film grain.
 *
 * A single tiled noise texture at very low opacity. Large flat gradients band
 * badly on 8-bit displays — visible stepping across a sky is the fastest way
 * for something rendered to look cheap — and a little noise dithers it away.
 */
function Grain() {
  return (
    <div
      className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
