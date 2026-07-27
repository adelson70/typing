import type { Locale } from '@/constants/i18n';

/** Minimal structural type for a JSON-LD node. */
export interface JsonLdNode {
  '@type': string;
  [key: string]: unknown;
}

/** A top-level JSON-LD document, carrying the context. */
export interface JsonLdDocument extends JsonLdNode {
  '@context': 'https://schema.org';
}

export interface BreadcrumbItem {
  /** Visible label. */
  readonly name: string;
  /** Root-relative path, e.g. `/typing-test/`. Omit on the final (current) crumb. */
  readonly path?: string;
}

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export interface HowToStep {
  readonly name: string;
  readonly text: string;
}

/** Everything a page needs to emit a complete, unique <head>. */
export interface SeoMeta {
  readonly title: string;
  readonly description: string;
  /** Locale-agnostic route key, e.g. `typing-test`. Drives canonical + hreflang. */
  readonly routeKey: string;
  readonly locale: Locale;
  // `| undefined` is explicit throughout: under `exactOptionalPropertyTypes`,
  // an omitted prop and a prop passed as `undefined` are different types, and
  // pages routinely pass conditional values (e.g. an optional updated date).
  readonly ogType?: 'website' | 'article' | undefined;
  readonly ogImage?: string | undefined;
  readonly keywords?: readonly string[] | undefined;
  readonly noindex?: boolean | undefined;
  readonly publishedTime?: Date | undefined;
  readonly modifiedTime?: Date | undefined;
  readonly author?: string | undefined;
  /** Locales that actually have this page. Defaults to all. */
  readonly availableLocales?: readonly Locale[] | undefined;
}
