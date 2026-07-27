/**
 * Progression persistence.
 *
 * XP, unlocked achievements and personal bests live in LocalStorage rather than
 * IndexedDB: the HUD reads them on every page load and needs them synchronously
 * to avoid a flash of "Level 1" before the real value arrives.
 *
 * Test history stays in IndexedDB — it grows without bound and is read rarely.
 */

import { readJson, writeJson } from './localStorage';
import type { ProgressState, UnlockedAchievement } from '@/features/progression/domain/types';

export const PROGRESS_STORAGE_KEY = 'ts:progress' as const;
export const PROGRESS_SCHEMA_VERSION = 1 as const;

export const EMPTY_PROGRESS: ProgressState = {
  version: PROGRESS_SCHEMA_VERSION,
  totalXp: 0,
  bestCombo: 0,
  longestStreak: 0,
  unlocked: [],
  lastActiveDate: null,
};

/**
 * Structural validation of the persisted payload.
 *
 * Anything failing this falls back to a fresh record rather than letting
 * `undefined` reach the level calculation, where it would render as NaN.
 */
function isProgressState(value: unknown): value is ProgressState {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;

  return (
    p['version'] === PROGRESS_SCHEMA_VERSION &&
    typeof p['totalXp'] === 'number' &&
    Number.isFinite(p['totalXp']) &&
    typeof p['bestCombo'] === 'number' &&
    typeof p['longestStreak'] === 'number' &&
    Array.isArray(p['unlocked']) &&
    p['unlocked'].every(
      (entry): entry is UnlockedAchievement =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as Record<string, unknown>)['id'] === 'string',
    ) &&
    (p['lastActiveDate'] === null || typeof p['lastActiveDate'] === 'string')
  );
}

export function loadProgress(): ProgressState {
  return readJson(PROGRESS_STORAGE_KEY, isProgressState) ?? EMPTY_PROGRESS;
}

export function saveProgress(state: ProgressState): boolean {
  return writeJson(PROGRESS_STORAGE_KEY, state);
}

export interface ProgressUpdate {
  readonly xpGained: number;
  readonly bestCombo: number;
  readonly currentStreak: number;
  readonly unlockedIds: readonly string[];
  readonly completedAt: number;
}

/**
 * Applies a completed test to the stored progression.
 *
 * XP only ever increases, and an achievement is never re-recorded — both are
 * enforced here rather than trusted from the caller, so a double-submit or a
 * replayed result cannot inflate a player's record.
 */
export function applyProgress(
  current: ProgressState,
  update: ProgressUpdate,
): ProgressState {
  const alreadyUnlocked = new Set(current.unlocked.map((entry) => entry.id));

  const newlyUnlocked: UnlockedAchievement[] = update.unlockedIds
    .filter((id) => !alreadyUnlocked.has(id))
    .map((id) => ({ id, unlockedAt: update.completedAt }));

  return {
    version: PROGRESS_SCHEMA_VERSION,
    totalXp: current.totalXp + Math.max(0, Math.round(update.xpGained)),
    bestCombo: Math.max(current.bestCombo, update.bestCombo),
    longestStreak: Math.max(current.longestStreak, update.currentStreak),
    unlocked: [...current.unlocked, ...newlyUnlocked],
    lastActiveDate: new Date(update.completedAt).toISOString().slice(0, 10),
  };
}

/** Erases progression. Paired with clearing history for the privacy promise. */
export function resetProgress(): boolean {
  return saveProgress(EMPTY_PROGRESS);
}
