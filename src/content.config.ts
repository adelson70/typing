import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// `z` re-exported from `astro:content` is deprecated in Astro 7; the schema
// library is imported directly from its own entry point instead.
import { z } from 'astro/zod';

import { LOCALES } from '@/constants/i18n';
import { BLOG_CATEGORIES, type BlogCategory } from '@/constants/blog';

/**
 * Blog collection.
 *
 * The schema is the editorial contract: a missing description or an unknown
 * category fails the build rather than shipping a page with degraded metadata.
 * `relatedPages` is required because an article that recommends no tool is a
 * dead end in the internal link graph.
 */

// Re-exported for convenience; the list itself lives in a plain module so
// tests can read it without the `astro:content` virtual module.
export { BLOG_CATEGORIES, type BlogCategory };

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(10).max(70),
    description: z.string().min(50).max(165),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(BLOG_CATEGORIES),
    locale: z.enum(LOCALES),
    /** Route keys of tools this article should drive traffic to. */
    relatedPages: z.array(z.string()).min(1),
    /** Slugs of related articles. */
    relatedArticles: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    /** Estimated reading time in minutes. */
    readingTime: z.number().int().positive(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
