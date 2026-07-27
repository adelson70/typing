/**
 * Scoring a finished run.
 *
 * The decision half of the finish pipeline — what a run earned — extracted from
 * the arenas so it is defined once and tested once. Rules like "a first-ever
 * test is not a personal best" were previously duplicated across two components,
 * where they could drift apart silently.
 *
 * Deliberately pure: the caller does the reading and writing, this decides.
 */

import type { TypingMetrics } from '@/features/typing/domain/types';
import type { AggregateStats } from '@/services/storage/resultsRepository';
import { calculateXp } from './xp';
import type { ProgressSnapshot, ProgressState, XpAward } from './types';

export interface RunInput {
  readonly metrics: TypingMetrics;
  readonly bestCombo: number;
  /** Stats from *before* this run — what a personal best is measured against. */
  readonly priorStats: AggregateStats;
  /** Stats including this run, so today's first test earns its own streak bonus. */
  readonly statsAfter: AggregateStats;
  /** Best accuracy across all history, including this run. */
  readonly bestAccuracySeen: number;
  /** Progression state after the XP write, for the achievement snapshot. */
  readonly storedAfterXp: ProgressState;
}

export interface RunOutcome {
  readonly award: XpAward;
  readonly isPersonalBest: boolean;
  readonly snapshot: ProgressSnapshot;
}

/**
 * Decides what a finished run earned.
 *
 * `isPersonalBest` requires at least one prior test: without that guard a
 * player's very first run would always be a "personal best", which is true but
 * meaningless and hands out the bonus for free.
 */
export function scoreRun(input: RunInput): RunOutcome {
  const { metrics, bestCombo, priorStats, statsAfter, bestAccuracySeen, storedAfterXp } = input;

  const isPersonalBest = priorStats.testsCompleted > 0 && metrics.wpm > priorStats.bestWpm;

  const award = calculateXp({
    metrics,
    bestCombo,
    streakDays: statsAfter.currentStreak,
    isPersonalBest,
  });

  // Evaluated against the state *after* this run, so a test that crosses a
  // threshold unlocks it immediately rather than on the next one.
  const snapshot: ProgressSnapshot = {
    totalXp: storedAfterXp.totalXp,
    testsCompleted: statsAfter.testsCompleted,
    bestWpm: Math.max(statsAfter.bestWpm, metrics.wpm),
    bestAccuracy: Math.max(bestAccuracySeen, metrics.accuracy),
    currentStreak: statsAfter.currentStreak,
    longestStreak: storedAfterXp.longestStreak,
    totalTimeMs: statsAfter.totalTimeMs,
    bestCombo: storedAfterXp.bestCombo,
    unlocked: storedAfterXp.unlocked.map((entry) => entry.id),
  };

  return { award, isPersonalBest, snapshot };
}
