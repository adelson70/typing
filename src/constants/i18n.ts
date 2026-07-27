/**
 * Locale registry. Adding a language means adding one entry here plus its
 * translation dictionary — routing, hreflang, sitemap and canonical logic all
 * derive from this file.
 */

export const LOCALES = ['en', 'pt-br'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** BCP-47 tags used for `hreflang`, `<html lang>` and `og:locale`. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-US',
  'pt-br': 'pt-BR',
};

/** `og:locale` wants underscores, not hyphens. */
export const OG_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  'pt-br': 'pt_BR',
};

/** Human-readable names for the language switcher. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  'pt-br': 'Português',
};

/** Shape required by @astrojs/sitemap's `i18n.locales` option. */
export const SITEMAP_LOCALE_MAP: Record<Locale, string> = LOCALE_TAGS;

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Extracts the locale from a pathname, falling back to the default.
 * `/pt-br/typing-test/` -> `pt-br`; `/typing-test/` -> `en`.
 */
export function localeFromPath(pathname: string): Locale {
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment && isLocale(segment) ? segment : DEFAULT_LOCALE;
}

/**
 * Strips the locale prefix, yielding the locale-agnostic route key used to
 * pair translations for hreflang.
 * `/pt-br/typing-test/` -> `typing-test`
 */
export function routeKeyFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0]!)) segments.shift();
  return segments.join('/');
}

/**
 * Builds a root-relative path for a route key in a given locale.
 * Always returns a leading and trailing slash to match `trailingSlash: 'always'`.
 */
export function localizedPath(locale: Locale, routeKey: string): string {
  const key = routeKey.replace(/^\/+|\/+$/g, '');
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return key === '' ? `${prefix}/` : `${prefix}/${key}/`;
}
