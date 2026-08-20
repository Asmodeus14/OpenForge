/**
 * Captures the screenshots used in README.md.
 *
 *   npm run dev          # in another terminal
 *   node scripts/screenshots.mjs
 *
 * Uses whichever Chrome or Edge is already installed rather than downloading a
 * browser, because a 300MB dependency to take four pictures is a poor trade.
 *
 * Pages are requested once before capture. The dev server compiles routes on
 * demand, so an uncompiled route would otherwise be photographed mid-build.
 */

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'screenshots');
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:3000';

const BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

/**
 * Public, server-rendered pages only.
 *
 * Anything behind a wallet connection would photograph as a connect prompt,
 * which says nothing about the product. `/escrow` is included precisely
 * because that prompt is the real state for a visitor without a wallet.
 */
/**
 * Heights are set per page to end just below its content. The capture is the
 * viewport, so a uniform height leaves whichever page is shortest — the empty
 * escrow state especially — as a third of a screenshot and two thirds of
 * background.
 */
const SHOTS = [
  { name: 'landing', path: '/', width: 1440, height: 900 },
  { name: 'discover', path: '/discover', width: 1440, height: 810 },
  { name: 'funding', path: '/funding', width: 1440, height: 800 },
  { name: 'escrow', path: '/escrow', width: 1440, height: 560 },
];

function findBrowser() {
  const explicit = process.env.CHROME_PATH;
  if (explicit) {
    if (!existsSync(explicit)) throw new Error(`CHROME_PATH is set but not found: ${explicit}`);
    return explicit;
  }
  const found = BROWSERS.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      'No Chrome or Edge found. Set CHROME_PATH to a Chromium-based browser executable.',
    );
  }
  return found;
}

async function main() {
  const browser = findBrowser();
  console.log(`browser  ${browser}`);
  console.log(`base     ${BASE}\n`);

  mkdirSync(OUT, { recursive: true });

  for (const shot of SHOTS) {
    const url = `${BASE}${shot.path}`;

    // Compile the route first, so the capture photographs the page and not a
    // build in progress.
    const response = await fetch(url).catch(() => null);
    if (!response?.ok) {
      console.error(`FAIL  ${shot.name}  ${url} did not respond — is the dev server running?`);
      process.exitCode = 1;
      continue;
    }

    const file = join(OUT, `${shot.name}.png`);
    await run(browser, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-color-profile=srgb',
      '--virtual-time-budget=10000',
      `--window-size=${shot.width},${shot.height}`,
      `--screenshot=${file}`,
      url,
    ]).catch(() => undefined);

    if (!existsSync(file)) {
      console.error(`FAIL  ${shot.name}  browser produced no file`);
      process.exitCode = 1;
      continue;
    }

    const kb = Math.round(statSync(file).size / 1024);
    // A capture of an unpainted page is a solid colour and compresses to
    // almost nothing, which is worth catching here rather than in review.
    const suspect = kb < 12 ? '  <-- suspiciously small, check it rendered' : '';
    console.log(`ok    ${shot.name}.png  ${shot.width}x${shot.height}  ${kb} KB${suspect}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
