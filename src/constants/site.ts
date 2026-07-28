/**
 * Single source of truth for site-wide identity and absolute-URL generation.
 *
 * Every canonical, Open Graph, hreflang, sitemap and JSON-LD value derives from
 * `SITE_URL`. Changing the production domain is a one-line edit here.
 */

/**
 * Production origin. No trailing slash.
 */
export const SITE_URL = 'https://typing.abjr.dev' as const;

/** Path of the public sitemap (single urlset, all indexable routes). */
export const SITEMAP_PATH = '/sitemap.xml' as const;

/** Machine-readable site summary for LLM / AI crawlers. */
export const LLM_TXT_PATH = '/llm.txt' as const;

export const SITE_NAME = 'Typing Studio' as const;

/** Publisher used by Organization / Article JSON-LD. */
export const SITE_AUTHOR = 'Typing Studio' as const;

/** Drives `<meta name="theme-color">` and the PWA manifest. */
export const THEME_COLOR_DARK = '#0a0d16' as const;
export const THEME_COLOR_LIGHT = '#ffffff' as const;

/** Default social share image, relative to the site root. */
export const DEFAULT_OG_IMAGE = '/og/default.png' as const;

export const TWITTER_HANDLE = '@typingstudio' as const;

/**
 * Google AdSense publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`).
 *
 * Visible in page source on every AdSense site. Auto ads are configured
 * account-side; the loader script is the only thing the site emits.
 */
export const ADSENSE_CLIENT_ID = 'ca-pub-1013771521633474' as const;

export type SiteUrlPath = `/${string}`;

/**
 * Builds an absolute, canonical-safe URL.
 *
 * Normalizes to exactly one leading slash and a single trailing slash (except
 * the root and file-like paths such as `/robots.txt`), so the same logical page
 * never yields two canonical spellings.
 */
export function absoluteUrl(path: string): string {
  const cleaned = `/${path.replace(/^\/+/, '')}`;

  if (cleaned === '/') return `${SITE_URL}/`;

  // Preserve file paths (they must not gain a trailing slash).
  const hasExtension = /\.[a-z0-9]+$/i.test(cleaned);
  const normalized = hasExtension
    ? cleaned
    : `${cleaned.replace(/\/+$/, '')}/`;

  return `${SITE_URL}${normalized}`;
}
