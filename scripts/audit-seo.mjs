/**
 * Post-build SEO audit.
 *
 * Validates the *emitted HTML*, not the source. A component can typecheck
 * perfectly and still produce a page with a duplicate title or a missing
 * canonical, and only inspecting the build output catches that.
 *
 * Run with: node scripts/audit-seo.mjs
 * Exits non-zero on any failure, so it can gate a deployment.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';

const failures = [];
const warnings = [];

function fail(page, message) {
  failures.push(`${page}: ${message}`);
}

function warn(page, message) {
  warnings.push(`${page}: ${message}`);
}

/** Recursively collects every generated HTML file. */
async function collectHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtml(full)));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }

  return files;
}

const extract = (html, pattern) => html.match(pattern)?.[1]?.trim();

const files = await collectHtml(DIST);

if (files.length === 0) {
  console.error('No HTML found in dist/. Run `npm run build` first.');
  process.exit(1);
}

const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();

for (const file of files) {
  const page = relative(DIST, file).replace(/\\/g, '/');
  const html = await readFile(file, 'utf8');

  const isNoindex = /<meta name="robots" content="noindex/.test(html);

  // --- Required tags --------------------------------------------------
  const title = extract(html, /<title>([^<]*)<\/title>/);
  if (!title) fail(page, 'missing <title>');
  else if (title.length > 70) warn(page, `title is ${title.length} chars (>70)`);

  const description = extract(html, /<meta name="description" content="([^"]*)"/);
  if (!description) fail(page, 'missing meta description');
  else if (description.length > 170) warn(page, `description is ${description.length} chars`);

  const canonical = extract(html, /<link rel="canonical" href="([^"]*)"/);
  if (!canonical) fail(page, 'missing canonical');
  else if (!canonical.startsWith('https://')) fail(page, 'canonical is not absolute');

  // --- Heading structure ----------------------------------------------
  const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1Count === 0) fail(page, 'no <h1>');
  if (h1Count > 1) fail(page, `${h1Count} <h1> elements (must be exactly 1)`);

  // --- Language and social -------------------------------------------
  if (!/<html[^>]+lang="/.test(html)) fail(page, 'missing lang attribute on <html>');
  if (!/<meta property="og:title"/.test(html)) fail(page, 'missing og:title');
  if (!/<meta property="og:image"/.test(html)) fail(page, 'missing og:image');
  if (!/<meta name="twitter:card"/.test(html)) fail(page, 'missing twitter:card');

  // --- Structured data -------------------------------------------------
  const ldBlocks = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
  if (!ldBlocks) {
    fail(page, 'no JSON-LD');
  } else {
    for (const block of ldBlocks) {
      const json = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
      try {
        JSON.parse(json);
      } catch {
        fail(page, 'JSON-LD is not valid JSON');
      }
    }
  }

  // --- Accessibility ---------------------------------------------------
  const imagesWithoutAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/g) ?? []).length;
  if (imagesWithoutAlt > 0) fail(page, `${imagesWithoutAlt} <img> without alt`);

  // --- Uniqueness (indexable pages only) --------------------------------
  if (!isNoindex) {
    if (title) {
      const seen = titles.get(title);
      if (seen) fail(page, `duplicate title, also on ${seen}`);
      else titles.set(title, page);
    }

    if (description) {
      const seen = descriptions.get(description);
      if (seen) fail(page, `duplicate description, also on ${seen}`);
      else descriptions.set(description, page);
    }

    if (canonical) {
      const seen = canonicals.get(canonical);
      if (seen) fail(page, `duplicate canonical, also on ${seen}`);
      else canonicals.set(canonical, page);
    }
  }
}

// --- Sitemap and robots -------------------------------------------------
try {
  await readFile(join(DIST, 'sitemap-index.xml'), 'utf8');
} catch {
  failures.push('sitemap-index.xml was not generated');
}

try {
  const robots = await readFile(join(DIST, 'robots.txt'), 'utf8');
  if (!robots.includes('Sitemap:')) failures.push('robots.txt does not reference the sitemap');
} catch {
  failures.push('robots.txt was not generated');
}

// --- Report --------------------------------------------------------------
console.log(`\nAudited ${files.length} pages.\n`);

if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  for (const warning of warnings) console.log(`  ! ${warning}`);
  console.log('');
}

if (failures.length > 0) {
  console.error(`FAILED (${failures.length}):`);
  for (const failure of failures) console.error(`  x ${failure}`);
  process.exit(1);
}

console.log(`Passed: unique titles/descriptions/canonicals, single H1, valid JSON-LD,`);
console.log(`        OG + Twitter tags, lang attributes, sitemap and robots.txt.\n`);
