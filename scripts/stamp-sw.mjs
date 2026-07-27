/**
 * Stamps the service worker with a build id.
 *
 * The id is derived from the contents of the built assets, so it only changes
 * when the output actually changes. A timestamp would invalidate every
 * visitor's cache on every deploy even when nothing they hold is stale.
 *
 * Run after `astro build`.
 */

import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const SW = join(DIST, 'sw.js');

/**
 * Hashes the built output.
 *
 * Reads file *contents*, not just names. Astro fingerprints most asset
 * filenames, but not all of them — hashing names alone left the id unchanged
 * after a real CSS edit, which would have shipped a stale cache to every
 * returning visitor.
 */
async function hashBuild(dir) {
  const hash = createHash('sha256');
  const entries = await readdir(dir, { withFileTypes: true, recursive: true }).catch(() => []);

  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath ?? entry.path ?? dir, entry.name))
    // Sort so the id does not depend on filesystem enumeration order.
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    hash.update(file);
    hash.update(await readFile(file));
  }

  return hash.digest('hex').slice(0, 12);
}

// Hash the whole build except the service worker itself, which would otherwise
// change its own input every time it is stamped.
const buildId = await hashBuild(join(DIST, '_astro'));

let source;
try {
  source = await readFile(SW, 'utf8');
} catch {
  console.error('stamp-sw: dist/sw.js not found — run `astro build` first.');
  process.exit(1);
}

if (!source.includes('__BUILD_ID__')) {
  console.log(`stamp-sw: already stamped, leaving as is.`);
  process.exit(0);
}

await writeFile(SW, source.replaceAll('__BUILD_ID__', buildId));
console.log(`stamp-sw: cache version set to ${buildId}`);
