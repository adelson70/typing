import { describe, expect, it } from 'vitest';

import { scoreRun, type RunInput } from './runPipeline';
import type { TypingMetrics } from '@/features/typing/domain/types';
import type { AggregateStats } from '@/services/storage/resultsRepository';
import type { ProgressState } from './types';

function metrics(overrides: Partial<TypingMetrics> = {}): TypingMetrics {
  return {
    wpm: 60,
    rawWpm: 65,
    accuracy: 96,
    consistency: 80,
    correctChars: 300,
    incorrectChars: 10,
    extraChars: 0,
    missedChars: 0,
    totalKeystrokes: 310,
    elapsedMs: 60_000,
    ...overrides,
  };
}

function stats(overrides: Partial<AggregateStats> = {}): AggregateStats {
  return {
    testsCompleted: 5,
    averageWpm: 50,
    bestWpm: 55,
    averageAccuracy: 94,
    totalTimeMs: 300_000,
    currentStreak: 3,
    ...overrides,
  };
}

function stored(overrides: Partial<ProgressState> = {}): ProgressState {
  return {
    version: 1,
    totalXp: 1_000,
    bestCombo: 40,
    longestStreak: 4,
    unlocked: [{ id: 'first-test', unlockedAt: 0 }],
    lastActiveDate: '2026-07-27',
    ...overrides,
  };
}

function input(overrides: Partial<RunInput> = {}): RunInput {
  return {
    metrics: metrics(),
    bestCombo: 50,
    priorStats: stats(),
    statsAfter: stats({ testsCompleted: 6 }),
    bestAccuracySeen: 96,
    storedAfterXp: stored(),
    ...overrides,
  };
}

describe('scoreRun', () => {
  it('treats a run faster than every prior test as a personal best', () => {
    const outcome = scoreRun(
      input({ metrics: metrics({ wpm: 70 }), priorStats: stats({ bestWpm: 55 }) }),
    );

    expect(outcome.isPersonalBest).toBe(true);
  });

  it('refuses to call a first-ever test a personal best', () => {
    // Otherwise every player collects the personal-best bonus for free on the
    // run that established the baseline.
    const outcome = scoreRun(
      input({
        metrics: metrics({ wpm: 70 }),
        priorStats: stats({ testsCompleted: 0, bestWpm: 0 }),
      }),
    );

    expect(outcome.isPersonalBest).toBe(false);
  });

  it('does not award a personal best for merely matching the previous record', () => {
    const outcome = scoreRun(
      input({ metrics: metrics({ wpm: 55 }), priorStats: stats({ bestWpm: 55 }) }),
    );

    expect(outcome.isPersonalBest).toBe(false);
  });

  it('awards XP using the streak that includes this run', () => {
    // The streak bonus must count the run that earned it, so a first test of
    // the day is not paid at yesterday's rate.
    const withStreak = scoreRun(input({ statsAfter: stats({ currentStreak: 7 }) }));
    const withoutStreak = scoreRun(input({ statsAfter: stats({ currentStreak: 1 }) }));

    expect(withStreak.award.total).toBeGreaterThan(withoutStreak.award.total);
  });

  it('snapshots the best WPM as the higher of history and this run', () => {
    const outcome = scoreRun(
      input({ metrics: metrics({ wpm: 82 }), statsAfter: stats({ bestWpm: 55 }) }),
    );

    expect(outcome.snapshot.bestWpm).toBe(82);
  });

  it('snapshots the best accuracy as the higher of history and this run', () => {
    const outcome = scoreRun(
      input({ metrics: metrics({ accuracy: 91 }), bestAccuracySeen: 99 }),
    );

    expect(outcome.snapshot.bestAccuracy).toBe(99);
  });

  it('carries already-unlocked achievement ids into the snapshot', () => {
    // evaluateAchievements filters these out, so omitting them would re-unlock
    // and re-celebrate everything after every run.
    const outcome = scoreRun(
      input({
        storedAfterXp: stored({
          unlocked: [
            { id: 'first-test', unlockedAt: 0 },
            { id: 'wpm-40', unlockedAt: 1 },
          ],
        }),
      }),
    );

    expect(outcome.snapshot.unlocked).toEqual(['first-test', 'wpm-40']);
  });

  it('reads combo and longest streak from stored progression, not from this run', () => {
    // Both are all-time records maintained by applyProgress; recomputing them
    // from a single run would lower them.
    const outcome = scoreRun(
      input({ bestCombo: 5, storedAfterXp: stored({ bestCombo: 120, longestStreak: 30 }) }),
    );

    expect(outcome.snapshot.bestCombo).toBe(120);
    expect(outcome.snapshot.longestStreak).toBe(30);
  });
});
