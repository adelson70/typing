/**
 * Generates the PWA icon set, apple-touch icon and Open Graph image.
 *
 * Run with: node scripts/generate-assets.mjs
 *
 * The marks are drawn as SVG geometry rather than as `<text>` elements. Sharp
 * rasterises SVG through librsvg, which resolves fonts from the host system —
 * so a `<text>` node would render differently (or fall back to a substitute
 * face) depending on which machine ran the build. Paths render identically
 * everywhere, which is what an icon set needs.
 *
 * Colours are the design tokens from src/styles/global.css converted to hex,
 * because these files are consumed outside any CSS context.
 */

import { mkdir, writeFile } from 'node:fs/promises';

import sharp from 'sharp';

/**
 * Design tokens as hex. These files are consumed outside any CSS context —
 * a favicon has no access to custom properties — so the values are duplicated
 * here deliberately. Keep in sync with src/styles/global.css.
 */
/** ember-400: the energy colour, and the brand's primary mark. */
const EMBER = '#ff8a3d';
/** ember-300: the keycap's top face, giving the mark depth. */
const EMBER_LIGHT = '#ffa866';
/** volt-400: precision, used for the caret in the social card. */
const VOLT = '#4da3f5';
/** neutral-1000: the app canvas in dark mode. */
const INK = '#0a0d16';
const INK_SOFT = '#8b93a7';
const SURFACE = '#12151f';

/**
 * Draws a keycap with a typing caret, as pure geometry.
 *
 * The mark is the product's subject — a key being pressed — rather than a
 * monogram: at 16px in a browser tab, letterforms blur into an unreadable
 * smudge, while a keycap silhouette stays recognisable.
 *
 * Geometry rather than `<text>`: sharp rasterises SVG through librsvg, which
 * resolves fonts from the host system, so a text node would render differently
 * depending on which machine ran the build.
 *
 * @param {object} options
 * @param {number} options.size    Viewport edge length.
 * @param {string} options.fg      Keycap colour.
 * @param {string} options.bg      Background colour.
 * @param {number} options.padding Fraction of the size kept clear at the edges.
 *                                 Maskable icons need ~0.26 so the glyph
 *                                 survives being cropped to a circle.
 * @param {number} options.radius  Corner radius as a fraction of size.
 */
function monogramSvg({ size, fg, bg, padding = 0.16, radius = 0.22, fgLight }) {
  const inner = size * (1 - padding * 2);
  const left = size * padding;
  const top = size * padding;

  // Keycap occupies the full safe area; its top face is a lighter band so the
  // shape reads as a physical key rather than a flat tile.
  const capR = inner * 0.18;
  const faceH = inner * 0.79;

  /*
   * Caret: narrow and tall, sitting directly on the baseline.
   *
   * The first pass used a short, wide bar floating above a detached rule, which
   * read as an exclamation mark rather than a cursor. A real text caret is thin
   * and touches its baseline, so both were adjusted.
   */
  const caretW = inner * 0.075;
  const caretH = inner * 0.46;
  const caretX = left + (inner - caretW) / 2;
  const caretY = top + inner * 0.2;

  // Baseline the caret rests on, as in a text field.
  const baseW = inner * 0.46;
  const baseH = inner * 0.075;
  const baseX = left + (inner - baseW) / 2;
  const baseY = caretY + caretH;

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="${bg}"/>
  <rect x="${left}" y="${top}" width="${inner}" height="${inner}" rx="${capR}" fill="${fg}"/>
  <rect x="${left}" y="${top}" width="${inner}" height="${faceH}" rx="${capR}" fill="${fgLight ?? fg}"/>
  <rect x="${caretX}" y="${caretY}" width="${caretW}" height="${caretH}" rx="${caretW / 2}" fill="${bg}"/>
  <rect x="${baseX}" y="${baseY}" width="${baseW}" height="${baseH}" rx="${baseH / 2}" fill="${bg}" opacity="0.75"/>
</svg>`);
}

/**
 * The 1200x630 social card.
 *
 * Text here IS rendered as `<text>`, unlike the icons: the card is generated
 * once and committed, so host font differences do not affect what ships. A
 * generic family list keeps it legible even if the ideal face is unavailable.
 */
function ogSvg() {
  const W = 1200;
  const H = 630;

  // A row of prompt words in the three typing states, mirroring the real
  // arena: typed-correct, the caret position, then untyped.
  const words = [
    { text: 'the', state: 'correct' },
    { text: 'quick', state: 'correct' },
    { text: 'brown', state: 'current' },
    { text: 'fox jumps over', state: 'pending' },
  ];

  let x = 96;
  const glyph = 34;
  const rowY = 430;
  const spans = [];

  for (const word of words) {
    const fill =
      word.state === 'pending' ? '#5a6178' : word.state === 'current' ? EMBER : '#eef1f7';
    spans.push(
      `<text x="${x}" y="${rowY}" font-family="ui-monospace, 'JetBrains Mono', 'DejaVu Sans Mono', monospace" font-size="${glyph}" fill="${fill}">${word.text}</text>`,
    );
    if (word.state === 'current') {
      spans.push(
        `<rect x="${x - 6}" y="${rowY - glyph + 4}" width="4" height="${glyph + 8}" rx="2" fill="${EMBER}"/>`,
      );
    }
    x += word.text.length * glyph * 0.6 + glyph * 0.55;
  }

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${INK}"/>
      <stop offset="100%" stop-color="${SURFACE}"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="6" fill="${EMBER}"/>

  <!-- Brand lockup -->
  <rect x="96" y="86" width="64" height="64" rx="16" fill="${EMBER}"/>
  <text x="128" y="129" font-family="ui-monospace, 'JetBrains Mono', monospace" font-size="30" font-weight="700" fill="${INK}" text-anchor="middle">TS</text>
  <text x="180" y="129" font-family="system-ui, 'DejaVu Sans', sans-serif" font-size="30" font-weight="600" fill="#eef1f7">Typing Studio</text>

  <!-- Headline -->
  <text x="96" y="248" font-family="system-ui, 'DejaVu Sans', sans-serif" font-size="72" font-weight="700" fill="#ffffff">Type faster.</text>
  <text x="96" y="330" font-family="system-ui, 'DejaVu Sans', sans-serif" font-size="72" font-weight="700" fill="${INK_SOFT}">Measure everything.</text>

  <!-- Live prompt sample -->
  ${spans.join('\n  ')}

  <!-- Proof points -->
  <text x="96" y="545" font-family="system-ui, 'DejaVu Sans', sans-serif" font-size="26" fill="${INK_SOFT}">Free  ·  No account  ·  Works offline  ·  Your data never leaves your device</text>
</svg>`);
}

const OUT_ICONS = 'public/icons';
const OUT_OG = 'public/og';

await mkdir(OUT_ICONS, { recursive: true });
await mkdir(OUT_OG, { recursive: true });

const targets = [
  // Standard PWA icons: the mark sits on the brand square.
  { file: `${OUT_ICONS}/icon-192.png`, size: 192, opts: { fg: EMBER, bg: INK, fgLight: EMBER_LIGHT } },
  { file: `${OUT_ICONS}/icon-512.png`, size: 512, opts: { fg: EMBER, bg: INK, fgLight: EMBER_LIGHT } },
  // Maskable: Android crops to a circle, so the glyph needs a wider safe zone
  // and the background must bleed to the full square (radius 0).
  {
    file: `${OUT_ICONS}/icon-maskable-512.png`,
    size: 512,
    opts: { fg: EMBER, bg: INK, fgLight: EMBER_LIGHT, padding: 0.26, radius: 0 },
  },
  // iOS ignores transparency and applies its own mask, so this is opaque.
  { file: `${OUT_ICONS}/apple-touch-icon.png`, size: 180, opts: { fg: EMBER, bg: INK, fgLight: EMBER_LIGHT } },
  // Favicon fallbacks for browsers that ignore the SVG.
  { file: 'public/favicon-32.png', size: 32, opts: { fg: EMBER, bg: INK, fgLight: EMBER_LIGHT, padding: 0.1 } },
  { file: 'public/favicon-16.png', size: 16, opts: { fg: EMBER, bg: INK, fgLight: EMBER_LIGHT, padding: 0.08 } },
];

for (const target of targets) {
  const svg = monogramSvg({ size: target.size, ...target.opts });
  await sharp(svg).png({ compressionLevel: 9 }).toFile(target.file);
  console.log(`  ${target.file} (${target.size}x${target.size})`);
}

await sharp(ogSvg()).png({ compressionLevel: 9 }).toFile(`${OUT_OG}/default.png`);
console.log(`  ${OUT_OG}/default.png (1200x630)`);

// A multi-resolution .ico still matters for browser tabs, bookmarks and
// Windows pinned sites, several of which ignore the SVG favicon entirely.
const icoSizes = [16, 32, 48];
const icoBuffers = await Promise.all(
  icoSizes.map((size) =>
    sharp(monogramSvg({ size, fg: EMBER, bg: INK, fgLight: EMBER_LIGHT, padding: 0.08, radius: 0.18 }))
      .png()
      .toBuffer(),
  ),
);

// Minimal ICO container: 6-byte header, then a 16-byte directory entry per
// image, then the PNG payloads. PNG-in-ICO is supported by every browser in use.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(icoSizes.length, 4);

let offset = 6 + icoSizes.length * 16;
const entries = [];

icoSizes.forEach((size, index) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(icoBuffers[index].length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += icoBuffers[index].length;
  entries.push(entry);
});

await writeFile('public/favicon.ico', Buffer.concat([header, ...entries, ...icoBuffers]));
console.log(`  public/favicon.ico (${icoSizes.join(', ')})`);

console.log('\nAssets generated.');
