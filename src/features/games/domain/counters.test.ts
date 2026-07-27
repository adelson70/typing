import { describe, expect, it } from 'vitest';

import { calculateAccuracy, computeMetrics } from '@/features/typing/domain/metrics';
import { EMPTY_GAME_COUNTERS, missedCharsFor, toTypingCounters } from './counters';
import type { GameCounters } from './types';

function counters(overrides: Partial<GameCounters> = {}): GameCounters {
  return { ...EMPTY_GAME_COUNTERS, ...overrides };
}

describe('missedCharsFor', () => {
  it('counts every character of a missed word, less the prefix already typed', () => {
    expect(missedCharsFor('alpha', '')).toBe(5);
    expect(missedCharsFor('alpha', 'al')).toBe(3);
    expect(missedCharsFor('alpha', 'alpha')).toBe(0);
  });

  it('never reports a negative count', () => {
    expect(missedCharsFor('al', 'alpha')).toBe(0);
  });
});

describe('toTypingCounters', () => {
  it('maps destroyed and missed words onto the word counters', () => {
    const mapped = toTypingCounters(counters({ wordsDestroyed: 7, wordsMissed: 2 }));

    expect(mapped.correctWords).toBe(7);
    expect(mapped.incorrectWords).toBe(2);
  });

  it('never reports extra characters, because a completed word disappears', () => {
    // Typing past the end is structurally impossible in a game, so inventing a
    // value here would corrupt the accuracy denominator.
    expect(toTypingCounters(counters({ correctChars: 50 })).extraChars).toBe(0);
  });

  it('produces an accuracy comparable with a typing test for the same keystrokes', () => {
    const game = toTypingCounters(
      counters({ correctChars: 90, incorrectChars: 10, missedChars: 0 }),
    );

    expect(calculateAccuracy(game)).toBe(90);
  });

  it('lets missed words drag accuracy down, so letting the screen fill has a cost', () => {
    const clean = toTypingCounters(counters({ correctChars: 100 }));
    const sloppy = toTypingCounters(counters({ correctChars: 100, missedChars: 50 }));

    expect(calculateAccuracy(sloppy)).toBeLessThan(calculateAccuracy(clean));
  });

  it('feeds computeMetrics without adaptation, which is the point of the shape', () => {
    const metrics = computeMetrics(
      toTypingCounters(counters({ correctChars: 250, incorrectChars: 10 })),
      [
        { second: 1, wpm: 40, rawWpm: 44, errors: 0 },
        { second: 2, wpm: 50, rawWpm: 54, errors: 1 },
      ],
      60_000,
    );

    expect(metrics.wpm).toBe(50);
    expect(metrics.consistency).toBeGreaterThan(0);
  });
});
