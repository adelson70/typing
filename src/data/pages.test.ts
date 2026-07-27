import { describe, expect, it } from 'vitest';

import { LANDING_PAGES, getLandingPage, getRelatedPages } from './pages';
import { isKnownRoute } from './routes';
import { LOCALES } from '@/constants/i18n';
import { getWordSource } from '@/features/typing/data/wordlists';

/**
 * These tests protect the SEO contract. A broken internal link, a duplicated
 * title or an orphaned page degrades indexing silently — the build still
 * succeeds, so only an assertion catches it.
 */

describe('landing page registry', () => {
  it('has unique route keys', () => {
    const keys = LANDING_PAGES.map((page) => page.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('uses SEO-friendly slugs', () => {
    for (const page of LANDING_PAGES) {
      expect(page.key).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('references a word source that exists', () => {
    for (const page of LANDING_PAGES) {
      expect(getWordSource(page.sourceId), `unknown source on ${page.key}`).toBeDefined();
    }
  });
});

describe('internal linking graph', () => {
  it('has no broken related-page links', () => {
    // Related keys may point at hub pages (typing-lessons, statistics) as well
    // as landing pages, so validation runs against the full route allow-list.
    for (const page of LANDING_PAGES) {
      for (const key of page.related) {
        expect(isKnownRoute(key), `${page.key} links to missing route ${key}`).toBe(true);
      }
    }
  });

  it('never links a page to itself', () => {
    for (const page of LANDING_PAGES) {
      expect(page.related).not.toContain(page.key);
    }
  });

  it('gives every page at least three related links', () => {
    // The brief requires three related pages per page for internal linking.
    for (const page of LANDING_PAGES) {
      expect(page.related.length, `${page.key} has too few links`).toBeGreaterThanOrEqual(3);
    }
  });

  it('resolves related landing pages to real page objects', () => {
    for (const page of LANDING_PAGES) {
      // Every resolved entry must be a genuine page, and hub keys are simply
      // filtered out rather than yielding undefined.
      for (const related of getRelatedPages(page)) {
        expect(getLandingPage(related.key)).toBeDefined();
      }
    }
  });

  it('leaves no page orphaned', () => {
    // Every page must be reachable from at least one other page.
    const linked = new Set(LANDING_PAGES.flatMap((page) => page.related));
    for (const page of LANDING_PAGES) {
      expect(linked.has(page.key), `${page.key} is orphaned`).toBe(true);
    }
  });

  it('recommends at least three articles per page', () => {
    for (const page of LANDING_PAGES) {
      expect(page.relatedArticles.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('metadata uniqueness', () => {
  for (const locale of LOCALES) {
    it(`has unique titles in ${locale}`, () => {
      const titles = LANDING_PAGES.map((page) => page.content[locale].title);
      expect(new Set(titles).size).toBe(titles.length);
    });

    it(`has unique descriptions in ${locale}`, () => {
      const descriptions = LANDING_PAGES.map((page) => page.content[locale].description);
      expect(new Set(descriptions).size).toBe(descriptions.length);
    });

    it(`keeps rendered titles within the SERP limit`, () => {
      // `<Seo>` appends " | Typing Studio" (16 chars) when the title does not
      // already contain the brand, so the source title must leave room for it.
      const BRAND_SUFFIX = ' | Typing Studio';
      const SERP_LIMIT = 70;

      for (const page of LANDING_PAGES) {
        const { title } = page.content[locale];
        const rendered = title.includes('Typing Studio') ? title : `${title}${BRAND_SUFFIX}`;

        expect(
          rendered.length,
          `${page.key} (${locale}) renders ${rendered.length} chars: ${rendered}`,
        ).toBeLessThanOrEqual(SERP_LIMIT);
      }
    });

    it(`keeps descriptions within the ~160 character SERP limit`, () => {
      for (const page of LANDING_PAGES) {
        const { description } = page.content[locale];
        expect(
          description.length,
          `${page.key} (${locale}) description too long`,
        ).toBeLessThanOrEqual(165);
      }
    });

    it(`has a non-empty H1, intro and keywords in ${locale}`, () => {
      for (const page of LANDING_PAGES) {
        const content = page.content[locale];
        expect(content.h1.length).toBeGreaterThan(0);
        expect(content.intro.length).toBeGreaterThan(0);
        expect(content.keywords.length).toBeGreaterThan(0);
      }
    });
  }
});

describe('FAQ content', () => {
  for (const locale of LOCALES) {
    it(`provides at least three FAQ entries per page in ${locale}`, () => {
      for (const page of LANDING_PAGES) {
        expect(page.content[locale].faq.length, `${page.key} (${locale})`).toBeGreaterThanOrEqual(3);
      }
    });

    it(`has substantive answers in ${locale}`, () => {
      // Thin FAQ answers are a known cause of rich-result rejection.
      for (const page of LANDING_PAGES) {
        for (const item of page.content[locale].faq) {
          expect(item.question.length).toBeGreaterThan(10);
          expect(item.answer.length, `${page.key}: "${item.question}"`).toBeGreaterThan(40);
        }
      }
    });

    it(`has body sections with real content in ${locale}`, () => {
      for (const page of LANDING_PAGES) {
        const { sections } = page.content[locale];
        expect(sections.length).toBeGreaterThanOrEqual(2);
        for (const section of sections) {
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.body.length).toBeGreaterThan(100);
        }
      }
    });
  }

  it('covers both locales for every page', () => {
    for (const page of LANDING_PAGES) {
      for (const locale of LOCALES) {
        expect(page.content[locale], `${page.key} missing ${locale}`).toBeDefined();
      }
    }
  });
});
