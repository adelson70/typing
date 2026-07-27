/**
 * JSON-LD builders.
 *
 * Each builder returns a plain object; `<JsonLd>` serialises it. Builders are
 * pure and independently testable, and every URL flows through `absoluteUrl()`
 * so structured data can never disagree with the canonical tag.
 */

import {
  SITE_NAME,
  SITE_URL,
  SITE_AUTHOR,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
} from '@/constants/site';
import { LOCALE_TAGS, type Locale } from '@/constants/i18n';
import type {
  BreadcrumbItem,
  FaqItem,
  HowToStep,
  JsonLdDocument,
  JsonLdNode,
} from '@/types/seo';

/** Stable @id anchors so nodes can cross-reference instead of duplicating. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization` as const;
export const WEBSITE_ID = `${SITE_URL}/#website` as const;

const withContext = (node: JsonLdNode): JsonLdDocument => ({
  '@context': 'https://schema.org',
  ...node,
});

export function organizationSchema(): JsonLdDocument {
  return withContext({
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: absoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/icons/icon-512.png'),
      width: 512,
      height: 512,
    },
    description:
      'Typing Studio builds free, private, browser-based tools for measuring and improving typing speed and accuracy.',
  });
}

/**
 * WebSite node including a SearchAction, which makes the site eligible for a
 * sitelinks search box in Google results.
 */
export function webSiteSchema(locale: Locale): JsonLdDocument {
  return withContext({
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: absoluteUrl('/'),
    inLanguage: LOCALE_TAGS[locale],
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });
}

/**
 * The typing tool itself. `offers` at price 0 is what makes the "Free" badge
 * eligible in rich results; `aggregateRating` is deliberately omitted because
 * we have no genuine review data and fabricating it violates Google policy.
 */
export function webApplicationSchema(options: {
  readonly name: string;
  readonly description: string;
  readonly routeKey: string;
  readonly locale: Locale;
}): JsonLdDocument {
  return withContext({
    '@type': 'WebApplication',
    name: options.name,
    url: absoluteUrl(`/${options.routeKey}`),
    description: options.description,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    inLanguage: LOCALE_TAGS[options.locale],
    isAccessibleForFree: true,
    publisher: { '@id': ORGANIZATION_ID },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  });
}

export function breadcrumbSchema(items: readonly BreadcrumbItem[]): JsonLdDocument {
  return withContext({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      // The current page carries no `item` URL, per Google's guidance.
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  });
}

export function faqSchema(items: readonly FaqItem[]): JsonLdDocument {
  return withContext({
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  });
}

export function howToSchema(options: {
  readonly name: string;
  readonly description: string;
  readonly steps: readonly HowToStep[];
}): JsonLdDocument {
  return withContext({
    '@type': 'HowTo',
    name: options.name,
    description: options.description,
    step: options.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  });
}

export function blogPostingSchema(options: {
  readonly title: string;
  readonly description: string;
  readonly routeKey: string;
  readonly locale: Locale;
  readonly publishedTime: Date;
  readonly modifiedTime?: Date;
  readonly author?: string;
  readonly image?: string;
}): JsonLdDocument {
  const url = absoluteUrl(`/${options.routeKey}`);

  return withContext({
    '@type': 'BlogPosting',
    headline: options.title,
    description: options.description,
    url,
    // Tells Google which URL the article canonically belongs to.
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: LOCALE_TAGS[options.locale],
    datePublished: options.publishedTime.toISOString(),
    dateModified: (options.modifiedTime ?? options.publishedTime).toISOString(),
    author: {
      '@type': 'Organization',
      name: options.author ?? SITE_AUTHOR,
      url: absoluteUrl('/'),
    },
    publisher: { '@id': ORGANIZATION_ID },
    image: {
      '@type': 'ImageObject',
      url: absoluteUrl(options.image ?? DEFAULT_OG_IMAGE),
    },
  });
}

/** A hub page listing child pages — category indexes, tool directories. */
export function collectionPageSchema(options: {
  readonly name: string;
  readonly description: string;
  readonly routeKey: string;
  readonly locale: Locale;
  readonly items: readonly { readonly name: string; readonly path: string }[];
}): JsonLdDocument {
  return withContext({
    '@type': 'CollectionPage',
    name: options.name,
    description: options.description,
    url: absoluteUrl(`/${options.routeKey}`),
    inLanguage: LOCALE_TAGS[options.locale],
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: options.items.length,
      itemListElement: options.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  });
}
