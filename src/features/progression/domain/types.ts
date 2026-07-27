/**
 * Progression domain types.
 *
 * The gamification layer is deliberately separate from the typing engine: the
 * engine measures, this rewards. Keeping them apart means a change to XP
 * curves can never alter how WPM is calculated.
 */

export interface LevelInfo {
  readonly level: number;
  /** XP accumulated inside the current level. */
  readonly xpIntoLevel: number;
  /** XP required to advance from this level to the next. */
  readonly xpForNextLevel: number;
  /** Progress through the current level, 0–1. Drives the HUD bar. */
  readonly progress: number;
  /** Total XP represented. */
  readonly totalXp: number;
}

/** A single XP award, itemised so the results screen can show its reasoning. */
export interface XpBreakdownEntry {
  readonly label: string;
  readonly amount: number;
}

export interface XpAward {
  readonly total: number;
  readonly entries: readonly XpBreakdownEntry[];
}

export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface Achievement {
  readonly id: string;
  readonly tier: AchievementTier;
  /** Icon glyph, rendered as text so no image request is needed. */
  readonly icon: string;
  /** Progress target — how far the player must get to unlock it. */
  readonly target: number;
}

export interface UnlockedAchievement {
  readonly id: string;
  readonly unlockedAt: number;
}

/** Everything needed to evaluate achievements after a test. */
export interface ProgressSnapshot {
  readonly totalXp: number;
  readonly testsCompleted: number;
  readonly bestWpm: number;
  readonly bestAccuracy: number;
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly totalTimeMs: number;
  readonly bestCombo: number;
  readonly unlocked: readonly string[];
}

/** The persisted progression record. */
export interface ProgressState {
  readonly version: number;
  readonly totalXp: number;
  readonly bestCombo: number;
  readonly longestStreak: number;
  readonly unlocked: readonly UnlockedAchievement[];
  /** `YYYY-MM-DD` of the most recent completed test, UTC. */
  readonly lastActiveDate: string | null;
}
