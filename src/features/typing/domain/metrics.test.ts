import { describe, expect, it } from 'vitest';

import {
  calculateAccuracy,
  calculateConsistency,
  calculateWpm,
  computeMetrics,
  formatDuration,
  formatTotalTime,
} from './metrics';
import type { TypingCounters, WpmSample } from './types';

const counters = (overrides: Partial<TypingCounters> = {}): TypingCounters => ({
  correctChars: 0,
  incorrectChars: 0,
  extraChars: 0,
  missedChars: 0,
  totalKeystrokes: 0,
  correctWords: 0,
  incorrectWords: 0,
  combo: 0,
  bestCombo: 0,
  ...overrides,
});

const sample = (second: number, rawWpm: number): WpmSample => ({
  second,
  wpm: rawWpm,
  rawWpm,
  errors: 0,
});

describe('calculateWpm', () => {
  it('treats five characters as one word', () => {
    // 300 chars in 60s => 60 words => 60 WPM
    expect(calculateWpm(300, 60_000)).toBe(60);
  });

  it('extrapolates sub-minute durations', () => {
    expect(calculateWpm(200, 30_000)).toBe(80);
  });

  it('returns 0 instead of Infinity when no time has elapsed', () => {
    expect(calculateWpm(100, 0)).toBe(0);
  });

  it('returns 0 for a negative duration', () => {
    expect(calculateWpm(100, -50)).toBe(0);
  });

  it('returns 0 when nothing was typed', () => {
    expect(calculateWpm(0, 60_000)).toBe(0);
  });
});

describe('calculateAccuracy', () => {
  it('scores correct characters against all typed characters', () => {
    expect(calculateAccuracy(counters({ correctChars: 90, incorrectChars: 10 }))).toBe(90);
  });

  it('counts extra and missed characters as errors', () => {
    expect(
      calculateAccuracy(
        counters({ correctChars: 90, incorrectChars: 5, extraChars: 3, missedChars: 2 }),
      ),
    ).toBe(90);
  });

  it('cannot be gamed by skipping words', () => {
    // Typing nothing but skipping 50 characters must not read as 100%.
    expect(calculateAccuracy(counters({ correctChars: 50, missedChars: 50 }))).toBe(50);
  });

  it('returns 0 before any input', () => {
    expect(calculateAccuracy(counters())).toBe(0);
  });
});

describe('calculateConsistency', () => {
  it('scores perfectly even typing as 100', () => {
    expect(calculateConsistency([sample(1, 60), sample(2, 60), sample(3, 60)])).toBe(100);
  });

  it('returns 0 when variance cannot be expressed', () => {
    expect(calculateConsistency([sample(1, 60)])).toBe(0);
    expect(calculateConsistency([])).toBe(0);
  });

  it('penalises erratic speed', () => {
    const erratic = calculateConsistency([sample(1, 20), sample(2, 100), sample(3, 30)]);
    expect(erratic).toBeGreaterThan(0);
    expect(erratic).toBeLessThan(70);
  });

  it('never returns a negative score', () => {
    const extreme = calculateConsistency([sample(1, 1), sample(2, 500), sample(3, 1)]);
    expect(extreme).toBeGreaterThanOrEqual(0);
  });
});

describe('computeMetrics', () => {
  it('derives raw WPM from every typed character and net WPM from correct ones', () => {
    const metrics = computeMetrics(
      counters({ correctChars: 250, incorrectChars: 25, extraChars: 25, totalKeystrokes: 300 }),
      [sample(1, 60), sample(2, 60)],
      60_000,
    );

    expect(metrics.wpm).toBe(50); // 250/5 per minute
    expect(metrics.rawWpm).toBe(60); // 300/5 per minute
    expect(metrics.rawWpm).toBeGreaterThan(metrics.wpm);
    expect(metrics.elapsedMs).toBe(60_000);
  });
});

describe('formatting', () => {
  it('formats sub-minute durations in seconds', () => {
    expect(formatDuration(45_000)).toBe('45s');
  });

  it('formats longer durations as m:ss', () => {
    expect(formatDuration(90_000)).toBe('1:30');
    expect(formatDuration(3_605_000)).toBe('60:05');
  });

  it('formats cumulative practice time', () => {
    expect(formatTotalTime(45 * 60_000)).toBe('45m');
    expect(formatTotalTime(2 * 3_600_000 + 15 * 60_000)).toBe('2h 15m');
    expect(formatTotalTime(3 * 3_600_000)).toBe('3h');
  });
});
