import { describe, expect, it } from 'vitest';

import {
  ACHIEVEMENTS,
  achievementProgress,
  evaluateAchievements,
  getAchievement,
  nextAchievement,
} from './achievements';
import type { ProgressSnapshot } from './types';

const snapshot = (overrides: Partial<ProgressSnapshot> = {}): ProgressSnapshot => ({
  totalXp: 0,
  testsCompleted: 0,
  bestWpm: 0,
  bestAccuracy: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalTimeMs: 0,
  bestCombo: 0,
  unlocked: [],
  ...overrides,
});

describe('achievement catalogue', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every achievement a positive target and an icon', () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(achievement.target, achievement.id).toBeGreaterThan(0);
      expect(achievement.icon.length, achievement.id).toBeGreaterThan(0);
    }
  });

  it('maps every id to a known progress source', () => {
    // A typo in the id would silently make an achievement permanently
    // unreachable, since progress would always evaluate to 0.
    const maxed = snapshot({
      testsCompleted: 1e6,
      bestWpm: 1e6,
      bestAccuracy: 100,
      currentStreak: 1e6,
      longestStreak: 1e6,
      totalTimeMs: 1e12,
      bestCombo: 1e6,
    });

    for (const achievement of ACHIEVEMENTS) {
      expect(
        achievementProgress(achievement.id, maxed),
        `${achievement.id} has no progress source`,
      ).toBeGreaterThan(0);
    }
  });

  it('resolves known ids and rejects unknown ones', () => {
    expect(getAchievement('first-test')).toBeDefined();
    expect(getAchievement('does-not-exist')).toBeUndefined();
  });
});

describe('evaluateAchievements', () => {
  it('unlocks nothing for a fresh player', () => {
    expect(evaluateAchievements(snapshot())).toEqual([]);
  });

  it('unlocks the first test immediately', () => {
    expect(evaluateAchievements(snapshot({ testsCompleted: 1 }))).toContain('first-test');
  });

  it('does not re-unlock what is already earned', () => {
    const unlocked = evaluateAchievements(
      snapshot({ testsCompleted: 1, unlocked: ['first-test'] }),
    );
    expect(unlocked).not.toContain('first-test');
  });

  it('unlocks every tier crossed at once', () => {
    const unlocked = evaluateAchievements(snapshot({ bestWpm: 100 }));
    expect(unlocked).toEqual(expect.arrayContaining(['wpm-40', 'wpm-60', 'wpm-80', 'wpm-100']));
  });

  it('uses the longest streak so a broken streak does not revoke progress', () => {
    const unlocked = evaluateAchievements(snapshot({ currentStreak: 0, longestStreak: 7 }));
    expect(unlocked).toContain('streak-7');
  });

  it('requires perfect accuracy for the perfect-accuracy award', () => {
    expect(evaluateAchievements(snapshot({ bestAccuracy: 99.5 }))).not.toContain(
      'accuracy-100',
    );
    expect(evaluateAchievements(snapshot({ bestAccuracy: 100 }))).toContain('accuracy-100');
  });
});

describe('nextAchievement', () => {
  it('returns nothing when the player has not started', () => {
    // Showing "0% toward 250 tests" would discourage rather than motivate.
    expect(nextAchievement(snapshot())).toBeNull();
  });

  it('surfaces the closest unearned achievement', () => {
    const next = nextAchievement(
      snapshot({ testsCompleted: 9, unlocked: ['first-test'] }),
    );
    expect(next?.achievement.id).toBe('tests-10');
    expect(next?.progress).toBeCloseTo(0.9, 5);
  });

  it('never suggests something already unlocked', () => {
    const unlocked = ACHIEVEMENTS.map((a) => a.id);
    expect(nextAchievement(snapshot({ testsCompleted: 5, unlocked }))).toBeNull();
  });

  it('caps reported progress at 1', () => {
    const next = nextAchievement(snapshot({ testsCompleted: 500 }));
    expect(next?.progress).toBeLessThanOrEqual(1);
  });
});
