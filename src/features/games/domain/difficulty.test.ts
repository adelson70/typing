import { describe, expect, it } from 'vitest';

import {
  MAX_CONCURRENT_WORDS,
  fallSpeed,
  fuseMs,
  levelForCleared,
  spawnIntervalMs,
} from './difficulty';

const LEVELS = Array.from({ length: 40 }, (_, i) => i + 1);

describe('levelForCleared', () => {
  it('starts every run at level one', () => {
    expect(levelForCleared(0)).toBe(1);
  });

  it('never goes down as more words are cleared', () => {
    let previous = 0;
    for (let cleared = 0; cleared < 500; cleared += 1) {
      const level = levelForCleared(cleared);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });

  it('takes progressively more words to gain each level', () => {
    // A linear ramp makes late levels arrive in seconds; the curve has to ease.
    const firstGap = firstClearedAtLevel(3) - firstClearedAtLevel(2);
    const laterGap = firstClearedAtLevel(6) - firstClearedAtLevel(5);
    expect(laterGap).toBeGreaterThan(firstGap);
  });
});

function firstClearedAtLevel(level: number): number {
  for (let cleared = 0; cleared < 100_000; cleared += 1) {
    if (levelForCleared(cleared) >= level) return cleared;
  }
  throw new Error(`level ${level} unreachable`);
}

describe('fallSpeed', () => {
  it('never decreases as the level rises', () => {
    for (let i = 1; i < LEVELS.length; i += 1) {
      expect(fallSpeed(LEVELS[i]!)).toBeGreaterThanOrEqual(fallSpeed(LEVELS[i - 1]!));
    }
  });

  it('stays bounded, so the game never becomes a reaction-time coin flip', () => {
    expect(fallSpeed(500)).toBeLessThan(0.35);
  });

  it('gives a fresh player time to read a word before it lands', () => {
    // At level 1 a word must survive well over five seconds, or a beginner
    // never finishes their first word.
    expect(1 / fallSpeed(1)).toBeGreaterThan(10);
  });
});

describe('spawnIntervalMs', () => {
  it('never increases as the level rises', () => {
    for (let i = 1; i < LEVELS.length; i += 1) {
      expect(spawnIntervalMs(LEVELS[i]!)).toBeLessThanOrEqual(spawnIntervalMs(LEVELS[i - 1]!));
    }
  });

  it('floors, so spawns can never outpace any possible typing speed', () => {
    expect(spawnIntervalMs(500)).toBeGreaterThanOrEqual(400);
  });
});

describe('fuseMs', () => {
  it('grants more time for a longer word', () => {
    expect(fuseMs(1, 9)).toBeGreaterThan(fuseMs(1, 3));
  });

  it('shortens as the level rises but never below the floor', () => {
    expect(fuseMs(5, 6)).toBeLessThanOrEqual(fuseMs(1, 6));
    expect(fuseMs(500, 3)).toBeGreaterThanOrEqual(2_500);
  });

  it('gives a fresh player time to read a short word, not just to type it', () => {
    // Regression: with no reaction allowance, a four-letter word computed to
    // 2.48s and clamped to the 2.5s floor — so a new player lost all three
    // lives in eight seconds. The floor is a last resort, not an opening
    // difficulty, and nothing at level 1 should be sitting on it.
    expect(fuseMs(1, 4)).toBeGreaterThan(4_000);
    expect(fuseMs(1, 3)).toBeGreaterThan(3_500);
  });

  it('only reaches the floor after a deep run, never at the start', () => {
    expect(fuseMs(1, 3)).toBeGreaterThan(2_500);
    expect(fuseMs(40, 3)).toBe(2_500);
  });

  it('stays winnable at every level, even for a long word', () => {
    // 2.5s for a nine-letter word is ~110 WPM — hard, but reachable, which is
    // the point at which a difficulty ramp stops being a difficulty ramp.
    for (const level of LEVELS) {
      expect(fuseMs(level, 9)).toBeGreaterThanOrEqual(2_500);
    }
  });
});

describe('MAX_CONCURRENT_WORDS', () => {
  it('caps the stage so DOM rendering stays cheap', () => {
    expect(MAX_CONCURRENT_WORDS).toBeLessThanOrEqual(25);
  });
});
