/**
 * Collapses @astrojs/sitemap output into a single /sitemap.xml.
 *
 * The integration always writes sitemap-index.xml plus sitemap-0.xml (and more
 * when the site grows). Search Console and robots.txt expect one urlset at
 * /sitemap.xml with every indexable URL listed explicitly.
 *
 * Run after `astro build`.
 */

import { readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const OUT = join(DIST, 'sitemap.xml');

const chunkFiles = (await readdir(DIST))
  .filter((name) => /^sitemap-\d+\.xml$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (chunkFiles.length === 0) {
  console.error('finalize-sitemap: no sitemap-N.xml in dist — run `astro build` first.');
  process.exit(1);
}

/** @param {string} xml */
function extractUrlEntries(xml) {
  const entries = [];
  const pattern = /<url>[\s\S]*?<\/url>/g;
  let match = pattern.exec(xml);
  while (match !== null) {
    entries.push(match[0]);
    match = pattern.exec(xml);
  }
  return entries;
}

let header = '';
const urls = [];

for (const file of chunkFiles) {
  const xml = await readFile(join(DIST, file), 'utf8');
  const chunkUrls = extractUrlEntries(xml);
  if (chunkUrls.length === 0) {
    console.error(`finalize-sitemap: ${file} contains no <url> entries.`);
    process.exit(1);
  }
  if (!header) {
    const firstUrl = xml.indexOf('<url>');
    header = xml.slice(0, firstUrl);
  }
  urls.push(...chunkUrls);
}

await writeFile(OUT, `${header}${urls.join('')}</urlset>`);

for (const file of chunkFiles) {
  await unlink(join(DIST, file));
}
await unlink(join(DIST, 'sitemap-index.xml')).catch(() => {});

console.log(`finalize-sitemap: wrote sitemap.xml (${urls.length} URLs)`);
