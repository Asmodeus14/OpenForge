/**
 * Derives the logo assets from the brand sheet.
 *
 * Kept in the repo so the assets are reproducible rather than mystery
 * binaries: if the sheet is ever updated, re-run `node scripts/build-logo.js`
 * instead of hand-editing a PNG somebody exported once.
 *
 *   assets/Logo_sheet.png  (source of truth, 2816×1536)
 *     → public/logo-mark.png   alpha-only mark, tinted at render time
 *     → app/icon.png           app icon, dark plate + white mark
 *     → app/apple-icon.png     same, sized for iOS
 *
 * The mark is emitted as an alpha mask with white RGB so the UI can colour it
 * with `currentColor` through a CSS mask. That is what makes one asset work in
 * both themes — a baked-black PNG disappears on a dark background, which is
 * exactly the bug the old `openforge.svg` had with its hardcoded #000000.
 */

const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SHEET = path.join(ROOT, 'assets', 'Logo_sheet.png');

/** The primary mark on the sheet. Trimmed after cropping, so these bounds
 *  only have to be generous rather than exact. */
const MARK_REGION = { left: 540, top: 160, width: 400, height: 480 };

const PLATE = '#0d0e10';

async function markAlpha() {
  const trimmed = await sharp(SHEET)
    .extract(MARK_REGION)
    .trim({ threshold: 20 })
    .toBuffer({ resolveWithObject: true });

  const { width, height } = trimmed.info;

  // White background, black mark → negated greyscale is exactly the coverage
  // we want as an alpha channel.
  const alpha = await sharp(trimmed.data).greyscale().negate().raw().toBuffer();

  return { width, height, alpha };
}

async function main() {
  const { width, height, alpha } = await markAlpha();
  console.log(`mark: ${width}×${height}`);

  // ---- public/logo-mark.png — white pixels, real alpha.
  const mark = await sharp({
    create: { width, height, channels: 3, background: '#ffffff' },
  })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();

  await sharp(mark).toFile(path.join(ROOT, 'public', 'logo-mark.png'));
  console.log('wrote public/logo-mark.png');

  // ---- app icons — the mark on a dark plate, matching the sheet's app icon.
  // A plate rather than a bare mark because a transparent favicon vanishes
  // against whichever tab colour the browser happens to use.
  for (const [file, size, radius] of [
    ['icon.png', 512, 114],
    ['apple-icon.png', 180, 40],
  ]) {
    const inner = Math.round(size * 0.56);
    const scaled = await sharp(mark)
      .resize({ height: inner, fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    const plate = Buffer.from(
      `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
         <rect width="${size}" height="${size}" rx="${radius}" fill="${PLATE}"/>
       </svg>`,
    );

    await sharp(plate)
      .composite([
        {
          input: scaled.data,
          left: Math.round((size - scaled.info.width) / 2),
          top: Math.round((size - scaled.info.height) / 2),
        },
      ])
      .png()
      .toFile(path.join(ROOT, 'app', file));

    console.log(`wrote app/${file} (${size}px)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
