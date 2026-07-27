/**
 * The combined achievement catalogue.
 *
 * Typing and game achievements share one `unlocked` list, so anything rendering
 * an unlock has to resolve against both. Without this, a game achievement shown
 * through the results panel would silently render as nothing — `getAchievement`
 * returns undefined for an id it does not own, and the caller skips it.
 */

import { GAME_ACHIEVEMENTS, getGameAchievement } from '@/features/games/domain/achievements';
import { ACHIEVEMENTS, getAchievement } from './achievements';
import type { Achievement } from './types';

export const ALL_ACHIEVEMENTS: readonly Achievement[] = [...ACHIEVEMENTS, ...GAME_ACHIEVEMENTS];

/** Resolves an id against either catalogue. */
export function resolveAchievement(id: string): Achievement | undefined {
  return getAchievement(id) ?? getGameAchievement(id);
}
