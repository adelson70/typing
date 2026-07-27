/**
 * Game achievements.
 *
 * A catalogue parallel to the typing one rather than an extension of it: the
 * progression snapshot is a projection of *test history*, and game milestones
 * read from a different source entirely.
 *
 * Unlock ids still land in the same `ProgressState.unlocked` array, so the
 * achievements page renders both catalogues from one stored set and no storage
 * change is needed.
 */

import type { Achievement } from '@/features/progression/domain/types';
import type { GamesState } from '@/services/storage/gameRepository';

/**
 * Ids are prefixed `game-` so they can never collide with the test catalogue,
 * which shares the single `unlocked` list.
 */
export const GAME_ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'game-first-run', tier: 'bronze', icon: '🎮', target: 1 },
  { id: 'game-runs-25', tier: 'silver', icon: '🕹️', target: 25 },

  // Word Rain: total words destroyed across every run.
  { id: 'game-rain-100', tier: 'bronze', icon: '🌧️', target: 100 },
  { id: 'game-rain-500', tier: 'silver', icon: '🌧️', target: 500 },
  { id: 'game-rain-2000', tier: 'gold', icon: '⛈️', target: 2_000 },

  // Survival: longest single run, in milliseconds.
  { id: 'game-survive-60', tier: 'bronze', icon: '⏳', target: 60_000 },
  { id: 'game-survive-180', tier: 'silver', icon: '⏳', target: 180_000 },
  { id: 'game-survive-300', tier: 'gold', icon: '🛡️', target: 300_000 },

  // Bomb Defusal: total bombs defused.
  { id: 'game-bomb-25', tier: 'bronze', icon: '💣', target: 25 },
  { id: 'game-bomb-100', tier: 'silver', icon: '💣', target: 100 },

  { id: 'game-combo-150', tier: 'silver', icon: '🔗', target: 150 },
];

const BY_ID = new Map(GAME_ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]));

export function getGameAchievement(id: string): Achievement | undefined {
  return BY_ID.get(id);
}

/** Everything the game catalogue evaluates against. */
export interface GameSnapshot {
  readonly runs: number;
  readonly wordsDestroyed: number;
  readonly longestSurvivalMs: number;
  readonly bombsDefused: number;
  readonly bestCombo: number;
  readonly unlocked: readonly string[];
}

/** Builds a snapshot from persisted game state. Pure. */
export function toGameSnapshot(
  games: GamesState,
  unlocked: readonly string[] = [],
): GameSnapshot {
  const all = Object.values(games.best);

  return {
    runs: all.reduce((total, stats) => total + stats.runs, 0),
    wordsDestroyed: games.best['word-rain']?.totalWordsDestroyed ?? 0,
    longestSurvivalMs: games.best['survival']?.longestSurvivalMs ?? 0,
    bombsDefused: games.best['bomb-defusal']?.totalWordsDestroyed ?? 0,
    bestCombo: all.reduce((best, stats) => Math.max(best, stats.bestCombo), 0),
    unlocked,
  };
}

/** Current value toward a game achievement's target, for progress bars. */
export function gameAchievementProgress(id: string, snapshot: GameSnapshot): number {
  switch (id) {
    case 'game-first-run':
    case 'game-runs-25':
      return snapshot.runs;

    case 'game-rain-100':
    case 'game-rain-500':
    case 'game-rain-2000':
      return snapshot.wordsDestroyed;

    case 'game-survive-60':
    case 'game-survive-180':
    case 'game-survive-300':
      return snapshot.longestSurvivalMs;

    case 'game-bomb-25':
    case 'game-bomb-100':
      return snapshot.bombsDefused;

    case 'game-combo-150':
      return snapshot.bestCombo;

    default:
      return 0;
  }
}

/** Game achievements newly satisfied by this snapshot. */
export function evaluateGameAchievements(snapshot: GameSnapshot): readonly string[] {
  const unlocked = new Set(snapshot.unlocked);

  return GAME_ACHIEVEMENTS.filter(
    (achievement) =>
      !unlocked.has(achievement.id) &&
      gameAchievementProgress(achievement.id, snapshot) >= achievement.target,
  ).map((achievement) => achievement.id);
}
