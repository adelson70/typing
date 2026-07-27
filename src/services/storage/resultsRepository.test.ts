import { describe, expect, it } from 'vitest';

import { aggregate, calculateStreak, toDateKey, type DailyEntry } from './resultsRepository';
import type { TestResult } from '@/features/typing/domain/types';

const DAY = 86_400_000;
const NOW = Date.parse('2026-07-27T12:00:00Z');

const day = (offsetDays: number, tests = 1): DailyEntry => ({
  date: toDateKey(NOW - offsetDays * DAY),
  tests,
  totalTimeMs: 60_000,
  bestWpm: 70,
  averageWpm: 65,
});

const result = (overrides: Partial<TestResult> = {}): TestResult => ({
  id: 'r1',
  completedAt: NOW,
  mode: 'time',
  limit: 60,
  sourceId: 'english-200',
  locale: 'en',
  samples: [],
  wpm: 60,
  rawWpm: 65,
  accuracy: 95,
  consistency: 80,
  correctChars: 300,
  incorrectChars: 10,
  extraChars: 0,
  missedChars: 0,
  totalKeystrokes: 310,
  elapsedMs: 60_000,
  ...overrides,
});

describe('toDateKey', () => {
  it('produces a UTC YYYY-MM-DD key', () => {
    expect(toDateKey(Date.parse('2026-07-27T23:59:00Z'))).toBe('2026-07-27');
  });

  it('groups all times within a UTC day together', () => {
    expect(toDateKey(Date.parse('2026-07-27T00:00:01Z'))).toBe(
      toDateKey(Date.parse('2026-07-27T23:59:59Z')),
    );
  });
});

describe('calculateStreak', () => {
  it('is zero with no history', () => {
    expect(calculateStreak([], NOW)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(calculateStreak([day(0), day(1), day(2)], NOW)).toBe(3);
  });

  it('survives a day not yet practised', () => {
    // Not practised today, but yesterday and before — the streak is alive.
    expect(calculateStreak([day(1), day(2), day(3)], NOW)).toBe(3);
  });

  it('breaks when the most recent activity is two days old', () => {
    expect(calculateStreak([day(2), day(3)], NOW)).toBe(0);
  });

  it('stops at the first gap', () => {
    // Today and yesterday, then a gap at day 2, then more history.
    expect(calculateStreak([day(0), day(1), day(3), day(4)], NOW)).toBe(2);
  });

  it('ignores days with no completed tests', () => {
    expect(calculateStreak([day(0), { ...day(1), tests: 0 }, day(2)], NOW)).toBe(1);
  });

  it('does not double count duplicate dates', () => {
    expect(calculateStreak([day(0), day(0), day(1)], NOW)).toBe(2);
  });
});

describe('aggregate', () => {
  it('returns zeroed stats with no results', () => {
    const stats = aggregate([], [], NOW);
    expect(stats.testsCompleted).toBe(0);
    expect(stats.averageWpm).toBe(0);
    expect(stats.bestWpm).toBe(0);
  });

  it('averages WPM and accuracy across results', () => {
    const stats = aggregate(
      [result({ wpm: 60, accuracy: 90 }), result({ id: 'r2', wpm: 80, accuracy: 100 })],
      [],
      NOW,
    );

    expect(stats.testsCompleted).toBe(2);
    expect(stats.averageWpm).toBe(70);
    expect(stats.averageAccuracy).toBe(95);
  });

  it('tracks the best result, not the latest', () => {
    const stats = aggregate(
      [result({ wpm: 95 }), result({ id: 'r2', wpm: 60 })],
      [],
      NOW,
    );
    expect(stats.bestWpm).toBe(95);
  });

  it('sums total practice time', () => {
    const stats = aggregate(
      [result({ elapsedMs: 60_000 }), result({ id: 'r2', elapsedMs: 30_000 })],
      [],
      NOW,
    );
    expect(stats.totalTimeMs).toBe(90_000);
  });

  it('includes the streak even when history is empty', () => {
    const stats = aggregate([], [day(0), day(1)], NOW);
    expect(stats.currentStreak).toBe(2);
  });
});
