import { describe, expect, it } from 'vitest';

import { calculateXp, levelFromXp, levelTitle, levelsGained, xpForLevel } from './xp';
import type { TypingMetrics } from '@/features/typing/domain/types';

const metrics = (overrides: Partial<TypingMetrics> = {}): TypingMetrics => ({
  wpm: 60,
  rawWpm: 65,
  accuracy: 95,
  consistency: 80,
  correctChars: 300,
  incorrectChars: 15,
  extraChars: 0,
  missedChars: 0,
  totalKeystrokes: 315,
  elapsedMs: 60_000,
  ...overrides,
});

const context = (overrides: Partial<Parameters<typeof calculateXp>[0]> = {}) => ({
  metrics: metrics(),
  bestCombo: 0,
  streakDays: 1,
  isPersonalBest: false,
  ...overrides,
});

describe('xpForLevel', () => {
  it('increases with level', () => {
    expect(xpForLevel(2)).toBeGreaterThan(xpForLevel(1));
    expect(xpForLevel(10)).toBeGreaterThan(xpForLevel(9));
  });

  it('flattens past the curve cap so progress never stalls', () => {
    expect(xpForLevel(80)).toBe(xpForLevel(60));
  });

  it('never returns a non-positive requirement', () => {
    for (const level of [0, -5, 1, 100]) {
      expect(xpForLevel(level)).toBeGreaterThan(0);
    }
  });
});

describe('levelFromXp', () => {
  it('starts every player at level 1', () => {
    const info = levelFromXp(0);
    expect(info.level).toBe(1);
    expect(info.progress).toBe(0);
  });

  it('levels up exactly at the threshold', () => {
    const needed = xpForLevel(1);
    expect(levelFromXp(needed - 1).level).toBe(1);
    expect(levelFromXp(needed).level).toBe(2);
  });

  it('keeps progress within 0 and 1', () => {
    for (const xp of [0, 50, 119, 120, 500, 10_000, 999_999]) {
      const info = levelFromXp(xp);
      expect(info.progress).toBeGreaterThanOrEqual(0);
      expect(info.progress).toBeLessThan(1);
    }
  });

  it('treats negative XP as zero rather than looping forever', () => {
    const info = levelFromXp(-500);
    expect(info.level).toBe(1);
    expect(info.totalXp).toBe(0);
  });

  it('reaches a high level within a plausible amount of XP', () => {
    // Sanity check that the curve is not so steep it is unreachable.
    expect(levelFromXp(500_000).level).toBeGreaterThan(30);
  });
});

describe('calculateXp', () => {
  it('awards nothing for a test too short to be real practice', () => {
    const award = calculateXp(context({ metrics: metrics({ elapsedMs: 1_000 }) }));
    expect(award.total).toBe(0);
    expect(award.entries).toEqual([]);
  });

  it('awards nothing when no character was typed correctly', () => {
    expect(calculateXp(context({ metrics: metrics({ correctChars: 0 }) })).total).toBe(0);
  });

  it('always pays something for a completed test', () => {
    // Even a poor run must be worth showing up for.
    const award = calculateXp(
      context({ metrics: metrics({ wpm: 15, accuracy: 70, correctChars: 60 }) }),
    );
    expect(award.total).toBeGreaterThan(0);
  });

  it('rewards accuracy more than speed', () => {
    const accurate = calculateXp(
      context({ metrics: metrics({ wpm: 50, accuracy: 100 }) }),
    ).total;
    const fast = calculateXp(context({ metrics: metrics({ wpm: 90, accuracy: 90 }) })).total;

    expect(accurate).toBeGreaterThan(fast);
  });

  it('gives no accuracy bonus below 90%', () => {
    const award = calculateXp(context({ metrics: metrics({ accuracy: 85 }) }));
    expect(award.entries.some((entry) => entry.label.includes('Accuracy'))).toBe(false);
  });

  it('itemises every bonus it awards', () => {
    const award = calculateXp(
      context({ bestCombo: 150, streakDays: 5, isPersonalBest: true }),
    );

    const labels = award.entries.map((entry) => entry.label);
    expect(labels.some((l) => l.includes('combo'))).toBe(true);
    expect(labels.some((l) => l.includes('streak'))).toBe(true);
    expect(labels).toContain('Personal best');

    // The headline total must equal the sum shown to the player.
    const sum = award.entries.reduce((acc, entry) => acc + entry.amount, 0);
    expect(award.total).toBe(sum);
  });

  it('caps the streak bonus so a missed day is survivable', () => {
    const week = calculateXp(context({ streakDays: 7 })).total;
    const year = calculateXp(context({ streakDays: 365 })).total;
    expect(year).toBe(week);
  });

  it('caps the combo bonus', () => {
    const big = calculateXp(context({ bestCombo: 400 })).total;
    const absurd = calculateXp(context({ bestCombo: 100_000 })).total;
    expect(absurd).toBe(big);
  });

  it('ignores a combo too small to represent a real run', () => {
    const none = calculateXp(context({ bestCombo: 0 })).total;
    const tiny = calculateXp(context({ bestCombo: 10 })).total;
    expect(tiny).toBe(none);
  });
});

describe('levelsGained', () => {
  it('is empty when no threshold is crossed', () => {
    expect(levelsGained(0, 10)).toEqual([]);
  });

  it('reports the level reached', () => {
    expect(levelsGained(0, xpForLevel(1))).toEqual([2]);
  });

  it('reports every level when several are crossed at once', () => {
    const gained = levelsGained(0, xpForLevel(1) + xpForLevel(2) + xpForLevel(3));
    expect(gained).toEqual([2, 3, 4]);
  });
});

describe('levelTitle', () => {
  it('gives every level a title', () => {
    for (const level of [1, 5, 10, 20, 35, 45, 60, 100]) {
      expect(levelTitle(level).length).toBeGreaterThan(0);
    }
  });

  it('changes as the player advances', () => {
    expect(levelTitle(1)).not.toBe(levelTitle(50));
  });
});
