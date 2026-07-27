/**
 * Every valid internal route key on the site.
 *
 * Landing pages come from the registry; hub and utility pages are declared
 * here. Together these form the allow-list that link validation checks against,
 * which is what makes a broken internal link a failing test rather than a 404
 * discovered by a crawler.
 */

import { GAME_ROUTE_KEYS } from '@/features/games/domain/registry';
import { LANDING_PAGES } from './pages';

/** Hand-authored pages that are not tool landing pages. */
export const STATIC_ROUTE_KEYS = [
  '', // home
  'typing-lessons',
  'typing-games',
  'statistics',
  'achievements',
  'history',
  'blog',
  'search',
  'about',
  'privacy',
] as const;

export const ALL_ROUTE_KEYS: readonly string[] = [
  ...STATIC_ROUTE_KEYS,
  // Derived from the game registry rather than repeated here, so adding a game
  // cannot leave the allow-list behind.
  ...GAME_ROUTE_KEYS,
  ...LANDING_PAGES.map((page) => page.key),
];

const ROUTE_SET = new Set(ALL_ROUTE_KEYS);

export function isKnownRoute(key: string): boolean {
  return ROUTE_SET.has(key.replace(/^\/+|\/+$/g, ''));
}
