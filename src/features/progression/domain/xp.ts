/**
 * XP and levelling.
 *
 * Pure functions over a completed test's metrics. The design intent behind each
 * rule is recorded because the numbers are otherwise arbitrary-looking:
 *
 *   - Accuracy is rewarded far more steeply than speed. A player optimising for
 *     XP is therefore optimising for the thing that actually makes them faster,
 *     rather than being pushed into error-practice.
 *   - Every completed test pays something. A run that pays nothing teaches the
 *     player that showing up on a bad day is worthless, which is exactly the
 *     day the habit needs protecting.
 *   - Bonuses are itemised, not lumped into one number, so the results screen
 *     can explain where the XP came from. Unexplained rewards feel arbitrary
 *     and stop motivating.
 */

import type { TypingMetrics } from '@/features/typing/domain/types';
import type { LevelInfo, XpAward, XpBreakdownEntry } from './types';

/** XP needed to leave level 1. */
const BASE_XP = 120;
/**
 * Growth per level. 1.18 gives a curve that is quick early (a new player levels
 * up within their first few tests, which is when quitting is most likely) and
 * slows enough later that a level stays meaningful.
 */
const GROWTH = 1.18;

/** Levels beyond this share the same requirement, so the curve never stalls. */
const MAX_CURVE_LEVEL = 60;

/** XP required to advance from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  const capped = Math.min(Math.max(1, level), MAX_CURVE_LEVEL);
  return Math.round(BASE_XP * GROWTH ** (capped - 1));
}

/** Resolves total XP into a level and progress through it. */
export function levelFromXp(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(totalXp));

  let level = 1;
  let remaining = safeXp;
  let required = xpForLevel(level);

  while (remaining >= required) {
    remaining -= required;
    level += 1;
    required = xpForLevel(level);
  }

  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: required,
    progress: required > 0 ? remaining / required : 0,
    totalXp: safeXp,
  };
}

export interface XpContext {
  readonly metrics: TypingMetrics;
  /** Longest unbroken run of correct characters in the test. */
  readonly bestCombo: number;
  /** Consecutive days practised, including today. */
  readonly streakDays: number;
  /** Whether this run beat the player's previous best WPM. */
  readonly isPersonalBest: boolean;
}

/**
 * Calculates the XP awarded for a completed test.
 *
 * A test shorter than three seconds earns nothing — otherwise tapping a key and
 * restarting would farm XP faster than actually practising.
 */
export function calculateXp(context: XpContext): XpAward {
  const { metrics, bestCombo, streakDays, isPersonalBest } = context;
  const entries: XpBreakdownEntry[] = [];

  if (metrics.elapsedMs < 3_000 || metrics.correctChars <= 0) {
    return { total: 0, entries: [] };
  }

  // Base: one XP per correct character, so longer practice pays more.
  const base = Math.round(metrics.correctChars);
  entries.push({ label: 'Characters typed', amount: base });

  // Accuracy: the dominant multiplier. Below 90% it contributes nothing, which
  // makes sloppy speed-farming a losing strategy.
  if (metrics.accuracy >= 90) {
    const scaled = (metrics.accuracy - 90) / 10; // 0 at 90%, 1 at 100%
    const bonus = Math.round(base * scaled * 0.8);
    if (bonus > 0) {
      entries.push({ label: `Accuracy ${Math.round(metrics.accuracy)}%`, amount: bonus });
    }
  }

  // Speed: a milder curve than accuracy, deliberately.
  if (metrics.wpm >= 30) {
    const bonus = Math.round(Math.min(metrics.wpm - 30, 90) * 1.5);
    if (bonus > 0) {
      entries.push({ label: `${Math.round(metrics.wpm)} WPM`, amount: bonus });
    }
  }

  // Combo: rewards sustained correctness, which is what accuracy alone misses —
  // 95% accuracy spread evenly is a very different skill from 95% in one burst.
  if (bestCombo >= 25) {
    const bonus = Math.round(Math.min(bestCombo, 400) * 0.25);
    entries.push({ label: `${bestCombo} combo`, amount: bonus });
  }

  // Streak: capped at 7 days. An uncapped streak bonus makes a missed day feel
  // catastrophic, and players who feel they have lost everything stop returning.
  if (streakDays >= 2) {
    const days = Math.min(streakDays, 7);
    entries.push({ label: `${streakDays}-day streak`, amount: days * 15 });
  }

  if (isPersonalBest) {
    entries.push({ label: 'Personal best', amount: 100 });
  }

  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  return { total, entries };
}

/**
 * Levels crossed by an XP award — drives the level-up celebration.
 * Returns an empty array when no threshold was passed.
 */
export function levelsGained(previousXp: number, awardedXp: number): readonly number[] {
  const before = levelFromXp(previousXp).level;
  const after = levelFromXp(previousXp + awardedXp).level;

  const gained: number[] = [];
  for (let level = before + 1; level <= after; level += 1) gained.push(level);
  return gained;
}

/**
 * Title shown beside the level number.
 *
 * Named tiers make a level feel like a rank rather than a counter — the same
 * reason games use "Gold III" instead of "Level 34".
 */
export function levelTitle(level: number): string {
  if (level >= 50) return 'Legend';
  if (level >= 40) return 'Master';
  if (level >= 30) return 'Expert';
  if (level >= 22) return 'Veteran';
  if (level >= 15) return 'Skilled';
  if (level >= 9) return 'Apprentice';
  if (level >= 4) return 'Novice';
  return 'Rookie';
}
