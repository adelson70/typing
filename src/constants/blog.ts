/**
 * Blog category vocabulary.
 *
 * Kept in a plain module rather than in `content.config.ts` so that tests and
 * tooling can import it without pulling in `astro:content`, which is a
 * build-time virtual module and unavailable outside the Astro pipeline.
 */

export const BLOG_CATEGORIES = [
  'typing-tips',
  'learning',
  'keyboard',
  'programming',
  'ergonomics',
  'productivity',
  'beginner',
  'advanced',
  'statistics',
  'speed',
  'accuracy',
  'gaming',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
