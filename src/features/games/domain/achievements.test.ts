import { describe, expect, it } from 'vitest';

import { ACHIEVEMENTS } from '@/features/progression/domain/achievements';
import { EMPTY_GAMES, type GamesState } from '@/services/storage/gameRepository';
import {
  GAME_ACHIEVEMENTS,
  evaluateGameAchievements,
  gameAchievementProgress,
  getGameAchievement,
  toGameSnapshot,
  type GameSnapshot,
} from './achievements';

function snapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    runs: 0,
    wordsDestroyed: 0,
    longestSurvivalMs: 0,
    bombsDefused: 0,
    bestCombo: 0,
    unlocked: [],
    ...overrides,
  };
}

const MAXED: GameSnapshot = snapshot({
  runs: 10_000,
  wordsDestroyed: 100_000,
  longestSurvivalMs: 10_000_000,
  bombsDefused: 10_000,
  bestCombo: 10_000,
});

describe('game achievement catalogue', () => {
  it('maps every game achievement id to a known progress source', () => {
    // Without this, adding an achievement without a matching case in the switch
    // ships one that can never be unlocked.
    for (const achievement of GAME_ACHIEVEMENTS) {
      expect(
        gameAchievementProgress(achievement.id, MAXED),
        `${achievement.id} has no progress source`,
      ).toBeGreaterThan(0);
    }
  });

  it('prefixes every id with "game-" so it cannot collide with the test catalogue', () => {
    // Both catalogues share one `unlocked` list in ProgressState, so a collision
    // would silently unlock the wrong achievement.
    for (const achievement of GAME_ACHIEVEMENTS) {
      expect(achievement.id.startsWith('game-')).toBe(true);
    }
  });

  it('shares no id with the typing achievements', () => {
    const typingIds = new Set(ACHIEVEMENTS.map((a) => a.id));

    for (const achievement of GAME_ACHIEVEMENTS) {
      expect(typingIds.has(achievement.id)).toBe(false);
    }
  });

  it('gives every achievement a unique id and a positive target', () => {
    const ids = GAME_ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const achievement of GAME_ACHIEVEMENTS) {
      expect(achievement.target).toBeGreaterThan(0);
    }
  });

  it('resolves a known id and returns undefined for anything else', () => {
    expect(getGameAchievement('game-first-run')?.tier).toBe('bronze');
    expect(getGameAchievement('nope')).toBeUndefined();
  });
});

describe('evaluateGameAchievements', () => {
  it('unlocks an achievement the moment its target is reached', () => {
    expect(evaluateGameAchievements(snapshot({ runs: 1 }))).toContain('game-first-run');
  });

  it('does not unlock one still short of its target', () => {
    expect(evaluateGameAchievements(snapshot({ runs: 0 }))).not.toContain('game-first-run');
  });

  it('excludes ids already unlocked, so nothing is celebrated twice', () => {
    const result = evaluateGameAchievements(
      snapshot({ runs: 30, unlocked: ['game-first-run'] }),
    );

    expect(result).not.toContain('game-first-run');
    expect(result).toContain('game-runs-25');
  });
});

describe('toGameSnapshot', () => {
  it('reads each milestone from the game it belongs to', () => {
    const games: GamesState = {
      ...EMPTY_GAMES,
      best: {
        'word-rain': {
          bestScore: 900,
          runs: 4,
          totalWordsDestroyed: 200,
          bestCombo: 60,
          totalTimeMs: 400_000,
          longestSurvivalMs: 120_000,
          bestWpm: 70,
        },
        survival: {
          bestScore: 180_000,
          runs: 2,
          totalWordsDestroyed: 50,
          bestCombo: 200,
          totalTimeMs: 300_000,
          longestSurvivalMs: 180_000,
          bestWpm: 65,
        },
      },
    };

    const result = toGameSnapshot(games);

    expect(result.runs).toBe(6);
    expect(result.wordsDestroyed).toBe(200);
    expect(result.longestSurvivalMs).toBe(180_000);
    // Best combo is the best across every game, not one of them.
    expect(result.bestCombo).toBe(200);
  });

  it('reports zeroes for a player who has never opened a game', () => {
    const result = toGameSnapshot(EMPTY_GAMES);

    expect(result.runs).toBe(0);
    expect(result.wordsDestroyed).toBe(0);
  });
});
