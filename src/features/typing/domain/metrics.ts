/**
 * Typing metric calculations.
 *
 * Pure functions over counters and samples — no DOM, no timers, no state. This
 * is the module that must stay correct above all others, so it is deliberately
 * free of any dependency that would make it hard to test.
 *
 * Definitions follow the industry-standard conventions used by typing
 * benchmarks, so scores are comparable with other platforms:
 *
 *   word      = 5 characters (including spaces)
 *   net WPM   = (correct characters / 5) / minutes
 *   raw WPM   = (all typed characters / 5) / minutes
 *   accuracy  = correct / (correct + incorrect + extra + missed)
 */

import type { TypingCounters, TypingMetrics, WpmSample } from './types';

/** The canonical characters-per-word constant. */
export const CHARS_PER_WORD = 5;

const MS_PER_MINUTE = 60_000;

/** Rounds to a fixed number of decimals without float display artefacts. */
export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Words per minute.
 *
 * Returns 0 for a non-positive duration rather than Infinity — a division that
 * would otherwise poison every downstream average and chart.
 */
export function calculateWpm(chars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || chars <= 0) return 0;
  const minutes = elapsedMs / MS_PER_MINUTE;
  return round(chars / CHARS_PER_WORD / minutes, 2);
}

/**
 * Accuracy as a percentage of all characters the user was scored on.
 *
 * Extra and missed characters count against accuracy: skipping a word or
 * mashing past its end are both errors, and excluding them would let a user
 * post 100% accuracy while typing nonsense.
 */
export function calculateAccuracy(counters: TypingCounters): number {
  const scored =
    counters.correctChars +
    counters.incorrectChars +
    counters.extraChars +
    counters.missedChars;

  if (scored <= 0) return 0;
  return round((counters.correctChars / scored) * 100, 2);
}

/**
 * Consistency, derived from the coefficient of variation of per-second WPM.
 *
 * A perfectly even typist has CV 0 → 100%. Larger swings lower the score.
 * Fewer than two samples cannot express variance, so we return 0 rather than a
 * misleading 100.
 */
export function calculateConsistency(samples: readonly WpmSample[]): number {
  const values = samples.map((s) => s.rawWpm).filter((v) => v > 0);
  if (values.length < 2) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean <= 0) return 0;

  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const cv = Math.sqrt(variance) / mean;

  // Clamp: CV can exceed 1 for extremely erratic typing.
  return round(Math.max(0, 1 - cv) * 100, 2);
}

/** Assembles the full metric set from counters, samples and elapsed time. */
export function computeMetrics(
  counters: TypingCounters,
  samples: readonly WpmSample[],
  elapsedMs: number,
): TypingMetrics {
  const typedChars =
    counters.correctChars + counters.incorrectChars + counters.extraChars;

  return {
    wpm: calculateWpm(counters.correctChars, elapsedMs),
    rawWpm: calculateWpm(typedChars, elapsedMs),
    accuracy: calculateAccuracy(counters),
    consistency: calculateConsistency(samples),
    correctChars: counters.correctChars,
    incorrectChars: counters.incorrectChars,
    extraChars: counters.extraChars,
    missedChars: counters.missedChars,
    totalKeystrokes: counters.totalKeystrokes,
    elapsedMs,
  };
}

/** Formats milliseconds as `m:ss`, or `s` when under a minute. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}s`;
}

/** Human-readable total practice time for the statistics page. */
export function formatTotalTime(ms: number): string {
  const totalMinutes = Math.floor(ms / MS_PER_MINUTE);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}
