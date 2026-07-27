import { describe, expect, it } from 'vitest';

import { EMPTY_PROGRESS, applyProgress } from './progressRepository';
import type { ProgressState } from '@/features/progression/domain/types';

const NOW = Date.parse('2026-07-27T12:00:00Z');

const update = (overrides: Partial<Parameters<typeof applyProgress>[1]> = {}) => ({
  xpGained: 100,
  bestCombo: 0,
  currentStreak: 1,
  unlockedIds: [] as readonly string[],
  completedAt: NOW,
  ...overrides,
});

describe('applyProgress', () => {
  it('accumulates XP', () => {
    const state = applyProgress(EMPTY_PROGRESS, update({ xpGained: 250 }));
    expect(state.totalXp).toBe(250);

    const next = applyProgress(state, update({ xpGained: 150 }));
    expect(next.totalXp).toBe(400);
  });

  it('never lets XP decrease', () => {
    // A negative award would otherwise let a bad run erase earned progress.
    const state: ProgressState = { ...EMPTY_PROGRESS, totalXp: 500 };
    expect(applyProgress(state, update({ xpGained: -1_000 })).totalXp).toBe(500);
  });

  it('rounds fractional XP', () => {
    expect(applyProgress(EMPTY_PROGRESS, update({ xpGained: 10.6 })).totalXp).toBe(11);
  });

  it('keeps the best combo, not the latest', () => {
    const state = applyProgress(EMPTY_PROGRESS, update({ bestCombo: 180 }));
    expect(applyProgress(state, update({ bestCombo: 40 })).bestCombo).toBe(180);
  });

  it('keeps the longest streak after it breaks', () => {
    const state = applyProgress(EMPTY_PROGRESS, update({ currentStreak: 12 }));
    expect(applyProgress(state, update({ currentStreak: 1 })).longestStreak).toBe(12);
  });

  it('records newly unlocked achievements with a timestamp', () => {
    const state = applyProgress(EMPTY_PROGRESS, update({ unlockedIds: ['first-test'] }));

    expect(state.unlocked).toHaveLength(1);
    expect(state.unlocked[0]?.id).toBe('first-test');
    expect(state.unlocked[0]?.unlockedAt).toBe(NOW);
  });

  it('never records the same achievement twice', () => {
    // A replayed or double-submitted result must not duplicate an unlock.
    const state = applyProgress(EMPTY_PROGRESS, update({ unlockedIds: ['first-test'] }));
    const again = applyProgress(state, update({ unlockedIds: ['first-test', 'wpm-40'] }));

    expect(again.unlocked.map((entry) => entry.id)).toEqual(['first-test', 'wpm-40']);
  });

  it('stores the active date as a UTC day key', () => {
    const state = applyProgress(
      EMPTY_PROGRESS,
      update({ completedAt: Date.parse('2026-07-27T23:30:00Z') }),
    );
    expect(state.lastActiveDate).toBe('2026-07-27');
  });

  it('stamps the schema version so stale payloads are rejected on read', () => {
    expect(applyProgress(EMPTY_PROGRESS, update()).version).toBe(EMPTY_PROGRESS.version);
  });
});
