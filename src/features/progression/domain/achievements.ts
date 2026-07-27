/**
 * Achievement catalogue and evaluation.
 *
 * Titles and descriptions live in the i18n dictionary, keyed by id, so the
 * catalogue stays language-neutral and a new locale needs no code change.
 *
 * The set is intentionally weighted toward *consistency* goals rather than
 * raw-speed goals: speed achievements only reward players who are already fast,
 * while streak and volume achievements are reachable by everyone and are what
 * actually keep people practising.
 */

import type { Achievement, ProgressSnapshot } from './types';

export const ACHIEVEMENTS: readonly Achievement[] = [
  // Volume — reachable by anyone, front-loaded so the first unlock comes early.
  { id: 'first-test', tier: 'bronze', icon: '🎯', target: 1 },
  { id: 'tests-10', tier: 'bronze', icon: '📈', target: 10 },
  { id: 'tests-50', tier: 'silver', icon: '🏅', target: 50 },
  { id: 'tests-250', tier: 'gold', icon: '👑', target: 250 },

  // Streaks — the strongest retention lever in the set.
  { id: 'streak-3', tier: 'bronze', icon: '🔥', target: 3 },
  { id: 'streak-7', tier: 'silver', icon: '🔥', target: 7 },
  { id: 'streak-30', tier: 'gold', icon: '💎', target: 30 },

  // Speed.
  { id: 'wpm-40', tier: 'bronze', icon: '⚡', target: 40 },
  { id: 'wpm-60', tier: 'silver', icon: '⚡', target: 60 },
  { id: 'wpm-80', tier: 'silver', icon: '🚀', target: 80 },
  { id: 'wpm-100', tier: 'gold', icon: '🚀', target: 100 },

  // Accuracy — the behaviour the product most wants to encourage.
  { id: 'accuracy-95', tier: 'bronze', icon: '🎯', target: 95 },
  { id: 'accuracy-99', tier: 'silver', icon: '💯', target: 99 },
  { id: 'accuracy-100', tier: 'gold', icon: '💯', target: 100 },

  // Combo.
  { id: 'combo-100', tier: 'bronze', icon: '🔗', target: 100 },
  { id: 'combo-300', tier: 'silver', icon: '🔗', target: 300 },

  // Practice time.
  { id: 'time-1h', tier: 'silver', icon: '⏱️', target: 3_600_000 },
  { id: 'time-10h', tier: 'gold', icon: '⏱️', target: 36_000_000 },
];

const BY_ID = new Map(ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]));

export function getAchievement(id: string): Achievement | undefined {
  return BY_ID.get(id);
}

/** Current value toward an achievement's target, used for progress bars. */
export function achievementProgress(id: string, snapshot: ProgressSnapshot): number {
  switch (id) {
    case 'first-test':
    case 'tests-10':
    case 'tests-50':
    case 'tests-250':
      return snapshot.testsCompleted;

    case 'streak-3':
    case 'streak-7':
    case 'streak-30':
      return Math.max(snapshot.currentStreak, snapshot.longestStreak);

    case 'wpm-40':
    case 'wpm-60':
    case 'wpm-80':
    case 'wpm-100':
      return snapshot.bestWpm;

    case 'accuracy-95':
    case 'accuracy-99':
    case 'accuracy-100':
      return snapshot.bestAccuracy;

    case 'combo-100':
    case 'combo-300':
      return snapshot.bestCombo;

    case 'time-1h':
    case 'time-10h':
      return snapshot.totalTimeMs;

    default:
      return 0;
  }
}

/**
 * Achievements newly satisfied by this snapshot.
 *
 * Already-unlocked ids are excluded, so the caller can treat the result as
 * "celebrate these now" without tracking state itself.
 */
export function evaluateAchievements(snapshot: ProgressSnapshot): readonly string[] {
  const unlocked = new Set(snapshot.unlocked);

  return ACHIEVEMENTS.filter(
    (achievement) =>
      !unlocked.has(achievement.id) &&
      achievementProgress(achievement.id, snapshot) >= achievement.target,
  ).map((achievement) => achievement.id);
}

/**
 * The achievement closest to completion but not yet unlocked.
 *
 * Surfacing this exploits the goal-gradient effect: effort rises as a visible
 * goal nears, so showing the nearest one is more motivating than showing a
 * full list the player must scan themselves.
 */
export function nextAchievement(
  snapshot: ProgressSnapshot,
): { readonly achievement: Achievement; readonly progress: number } | null {
  const unlocked = new Set(snapshot.unlocked);

  const candidates = ACHIEVEMENTS.filter((achievement) => !unlocked.has(achievement.id))
    .map((achievement) => ({
      achievement,
      progress: Math.min(
        1,
        achievementProgress(achievement.id, snapshot) / achievement.target,
      ),
    }))
    // Ignore anything not yet started: "0% toward 250 tests" is discouraging,
    // not motivating.
    .filter((candidate) => candidate.progress > 0)
    .sort((a, b) => b.progress - a.progress);

  return candidates[0] ?? null;
}
