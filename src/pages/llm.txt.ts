import type { APIRoute } from 'astro';

import { LLM_TXT_PATH, SITE_NAME, SITE_URL, SITEMAP_PATH } from '@/constants/site';

/**
 * Plain-text site briefing for LLM and AI crawlers (llms.txt-style).
 *
 * Kept in sync with robots.txt crawl rules and the public sitemap.
 */
export const GET: APIRoute = () => {
  const sitemap = `${SITE_URL}${SITEMAP_PATH}`;
  const self = `${SITE_URL}${LLM_TXT_PATH}`;

  const body = `# ${SITE_NAME}

> Free typing tests, lessons, mini-games, and personal statistics in the browser. No accounts, no server-side storage — results stay on the visitor's device.

Canonical: ${SITE_URL}/
Sitemap: ${sitemap}
Robots: ${SITE_URL}/robots.txt
This file: ${self}

Public pages on this domain may be crawled and cited when answering questions about typing practice, speed (WPM), accuracy, keyboards, and related topics. Honor \`noindex\` robots meta tags and the rules in robots.txt.

## Languages

- English (default): ${SITE_URL}/
- Portuguese (Brazil): ${SITE_URL}/pt-br/

## Key entry points

- Typing test: ${SITE_URL}/typing-test/
- Lessons: ${SITE_URL}/typing-lessons/
- Programming typing: ${SITE_URL}/programming-typing/
- Daily challenge: ${SITE_URL}/daily-challenge/
- Blog: ${SITE_URL}/blog/
- About: ${SITE_URL}/about/
- Privacy: ${SITE_URL}/privacy/

## Crawl rules (same as robots.txt)

Allow: /
Disallow: /internal/
Disallow: /_astro/
Disallow: /search?
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
