/**
 * Domain API for typing results.
 *
 * The UI talks to this module, never to IndexedDB directly, so the storage
 * mechanism can change without touching a component.
 */

import { STORE_DAILY, STORE_RESULTS } from '@/constants/storage';
import type { TestResult, TypingMetrics, TestConfig } from '@/features/typing/domain/types';
import { getAll, getRecent, getByKey, put, count } from './indexedDb';

/** Per-day rollup backing the activity heatmap and streak counter. */
export interface DailyEntry {
  /** `YYYY-MM-DD`, UTC. */
  readonly date: string;
  readonly tests: number;
  readonly totalTimeMs: number;
  readonly bestWpm: number;
  readonly averageWpm: number;
}

export interface AggregateStats {
  readonly testsCompleted: number;
  readonly averageWpm: number;
  readonly bestWpm: number;
  readonly averageAccuracy: number;
  readonly totalTimeMs: number;
  readonly currentStreak: number;
}

export const EMPTY_STATS: AggregateStats = {
  testsCompleted: 0,
  averageWpm: 0,
  bestWpm: 0,
  averageAccuracy: 0,
  totalTimeMs: 0,
  currentStreak: 0,
};

/** `YYYY-MM-DD` in UTC, matching the daily-challenge seed convention. */
export function toDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function createId(completedAt: number): string {
  // crypto.randomUUID is unavailable on insecure origins; the timestamp-based
  // fallback is unique enough for a single-device, single-user store.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${completedAt}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/**
 * Persists a completed test and updates the day's rollup.
 *
 * Returns the stored record so the caller can render it without a re-read.
 */
export async function saveResult(
  metrics: TypingMetrics,
  config: TestConfig,
  samples: TestResult['samples'],
  completedAt: number = Date.now(),
): Promise<TestResult> {
  const result: TestResult = {
    ...metrics,
    id: createId(completedAt),
    completedAt,
    mode: config.mode,
    limit: config.limit,
    sourceId: config.sourceId,
    locale: config.locale,
    samples,
  };

  await put(STORE_RESULTS, result);
  await updateDailyEntry(result);

  return result;
}

async function updateDailyEntry(result: TestResult): Promise<void> {
  const date = toDateKey(result.completedAt);
  const existing = await getByKey<DailyEntry>(STORE_DAILY, date);

  const tests = (existing?.tests ?? 0) + 1;
  const totalTimeMs = (existing?.totalTimeMs ?? 0) + result.elapsedMs;
  const previousAverage = existing?.averageWpm ?? 0;

  const entry: DailyEntry = {
    date,
    tests,
    totalTimeMs,
    bestWpm: Math.max(existing?.bestWpm ?? 0, result.wpm),
    // Running mean, so we never re-read the whole day's results.
    averageWpm: previousAverage + (result.wpm - previousAverage) / tests,
  };

  await put(STORE_DAILY, entry);
}

export function getRecentResults(limit = 50): Promise<TestResult[]> {
  return getRecent<TestResult>(STORE_RESULTS, 'completedAt', limit);
}

export function getAllResults(): Promise<TestResult[]> {
  return getAll<TestResult>(STORE_RESULTS);
}

export function getDailyEntries(): Promise<DailyEntry[]> {
  return getAll<DailyEntry>(STORE_DAILY);
}

export function countResults(): Promise<number> {
  return count(STORE_RESULTS);
}

/**
 * Consecutive days ending today (or yesterday) that contain at least one test.
 *
 * Yesterday is accepted as the anchor so a streak is not reported broken merely
 * because the user has not practised yet today.
 */
export function calculateStreak(entries: readonly DailyEntry[], now: number = Date.now()): number {
  if (entries.length === 0) return 0;

  const days = new Set(entries.filter((e) => e.tests > 0).map((e) => e.date));
  if (days.size === 0) return 0;

  const DAY_MS = 86_400_000;
  const today = toDateKey(now);
  const yesterday = toDateKey(now - DAY_MS);

  let cursor: number;
  if (days.has(today)) {
    cursor = now;
  } else if (days.has(yesterday)) {
    cursor = now - DAY_MS;
  } else {
    return 0;
  }

  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }

  return streak;
}

/** Aggregates history into the numbers shown on the statistics page. */
export function aggregate(
  results: readonly TestResult[],
  entries: readonly DailyEntry[],
  now: number = Date.now(),
): AggregateStats {
  if (results.length === 0) {
    return { ...EMPTY_STATS, currentStreak: calculateStreak(entries, now) };
  }

  let wpmSum = 0;
  let accuracySum = 0;
  let bestWpm = 0;
  let totalTimeMs = 0;

  for (const result of results) {
    wpmSum += result.wpm;
    accuracySum += result.accuracy;
    totalTimeMs += result.elapsedMs;
    if (result.wpm > bestWpm) bestWpm = result.wpm;
  }

  const round2 = (value: number): number => Math.round(value * 100) / 100;

  return {
    testsCompleted: results.length,
    averageWpm: round2(wpmSum / results.length),
    bestWpm: round2(bestWpm),
    averageAccuracy: round2(accuracySum / results.length),
    totalTimeMs,
    currentStreak: calculateStreak(entries, now),
  };
}
