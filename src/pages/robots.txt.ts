import type { APIRoute } from 'astro';

import { LLM_TXT_PATH, SITE_URL, SITEMAP_PATH } from '@/constants/site';

/**
 * robots.txt, generated so the sitemap URL can never drift from `SITE_URL`.
 *
 * Everything public is crawlable. Only build artefacts and the search results
 * page are blocked: parameterised search URLs generate unbounded near-duplicate
 * pages, which dilutes crawl budget without adding indexable value.
 */
export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /

# Internal and non-indexable paths
Disallow: /internal/
Disallow: /_astro/
Disallow: /search?

# AI crawlers are permitted; the content is public and freely licensed.
# Site summary for LLMs: ${SITE_URL}${LLM_TXT_PATH}

Sitemap: ${SITE_URL}${SITEMAP_PATH}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
