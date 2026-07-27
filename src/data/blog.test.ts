import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BLOG_CATEGORIES } from '@/constants/blog';
import { ALL_ROUTE_KEYS } from './routes';

/**
 * Blog integrity checks.
 *
 * The content collection schema already validates each article in isolation at
 * build time. What it cannot see is the *graph*: an article that links to a
 * deleted slug, or one that nothing links to. Both degrade indexing silently —
 * the build still succeeds — so only an assertion catches them.
 *
 * Frontmatter is parsed with regexes rather than by importing `astro:content`,
 * which is only available inside the Astro build pipeline.
 */

const BLOG_DIR = 'src/content/blog';

interface Article {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly locale: string;
  readonly relatedPages: readonly string[];
  readonly relatedArticles: readonly string[];
}

function parseList(frontmatter: string, key: string): readonly string[] {
  const match = new RegExp(`^${key}:\\s*\\[(.*?)\\]`, 'ms').exec(frontmatter);
  if (!match?.[1]) return [];
  return match[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function parseScalar(frontmatter: string, key: string): string {
  const match = new RegExp(`^${key}:\\s*['"]([^'"]*)['"]`, 'm').exec(frontmatter);
  return match?.[1] ?? '';
}

const articles: readonly Article[] = readdirSync(BLOG_DIR)
  .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
  .map((file) => {
    // Normalise line endings before parsing. Editors and scripts on Windows
    // write CRLF, and anchoring on `\n` alone silently yielded empty
    // frontmatter — every field parsed as '' and the failures pointed at the
    // content rather than at the parser.
    const raw = readFileSync(join(BLOG_DIR, file), 'utf8').replace(/\r\n/g, '\n');
    const frontmatter = /^---\n([\s\S]*?)\n---/.exec(raw)?.[1] ?? '';

    return {
      slug: file.replace(/\.mdx?$/, ''),
      title: parseScalar(frontmatter, 'title'),
      description: parseScalar(frontmatter, 'description'),
      category: parseScalar(frontmatter, 'category'),
      locale: parseScalar(frontmatter, 'locale'),
      relatedPages: parseList(frontmatter, 'relatedPages'),
      relatedArticles: parseList(frontmatter, 'relatedArticles'),
    };
  });

const slugs = new Set(articles.map((article) => article.slug));

describe('blog content', () => {
  it('has articles to validate', () => {
    expect(articles.length).toBeGreaterThan(0);
  });

  it('gives every article a parseable title and description', () => {
    for (const article of articles) {
      expect(article.title.length, `${article.slug} title`).toBeGreaterThanOrEqual(10);
      expect(article.description.length, `${article.slug} description`).toBeGreaterThanOrEqual(50);
    }
  });

  it('keeps titles and descriptions within SERP limits', () => {
    for (const article of articles) {
      expect(article.title.length, `${article.slug} title`).toBeLessThanOrEqual(70);
      expect(article.description.length, `${article.slug} description`).toBeLessThanOrEqual(165);
    }
  });

  it('uses only known categories', () => {
    for (const article of articles) {
      expect(
        (BLOG_CATEGORIES as readonly string[]).includes(article.category),
        `${article.slug} has category "${article.category}"`,
      ).toBe(true);
    }
  });

  it('has unique titles and descriptions', () => {
    const titles = articles.map((a) => a.title);
    const descriptions = articles.map((a) => a.description);

    expect(new Set(titles).size, 'duplicate title').toBe(titles.length);
    expect(new Set(descriptions).size, 'duplicate description').toBe(descriptions.length);
  });
});

describe('blog internal linking', () => {
  it('recommends only real tool pages', () => {
    for (const article of articles) {
      expect(article.relatedPages.length, `${article.slug} recommends no page`).toBeGreaterThan(0);

      for (const key of article.relatedPages) {
        expect(
          ALL_ROUTE_KEYS.includes(key),
          `${article.slug} links to unknown route "${key}"`,
        ).toBe(true);
      }
    }
  });

  it('links only to articles that exist', () => {
    for (const article of articles) {
      for (const slug of article.relatedArticles) {
        expect(slugs.has(slug), `${article.slug} links to missing article "${slug}"`).toBe(true);
      }
    }
  });

  it('never links an article to itself', () => {
    for (const article of articles) {
      expect(article.relatedArticles, `${article.slug} links to itself`).not.toContain(article.slug);
    }
  });

  it('leaves no article orphaned', () => {
    // Every article must be reachable from at least one sibling, otherwise it
    // depends entirely on the index page for discovery and accumulates no
    // internal link equity.
    const linked = new Set(articles.flatMap((article) => article.relatedArticles));
    const orphans = articles.filter((article) => !linked.has(article.slug)).map((a) => a.slug);

    expect(orphans, `orphaned articles: ${orphans.join(', ')}`).toEqual([]);
  });
});
