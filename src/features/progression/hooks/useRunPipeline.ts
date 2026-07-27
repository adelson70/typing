/**
 * The finish pipeline: read history, score the run, award XP, unlock achievements.
 *
 * Previously duplicated verbatim in TypingArena and CodeArena. Games would have
 * made it a third copy, so it lives here instead — the decision logic in
 * `scoreRun`, the IO orchestration below.
 *
 * All of it is best-effort: a storage failure must never prevent the player from
 * seeing the result they just earned.
 */

import { useCallback, useState } from 'react';

import type { TestConfig, TypingMetrics, WpmSample } from '@/features/typing/domain/types';
import type { CompletedRun } from '@/features/typing/components/ResultsPanel';
import {
  aggregate,
  getAllResults,
  getDailyEntries,
  saveResult,
} from '@/services/storage/resultsRepository';
import { evaluateAchievements } from '../domain/achievements';
import { scoreRun } from '../domain/runPipeline';
import { levelsGained } from '../domain/xp';
import { useProgress } from './useProgress';

export interface SubmitRunInput {
  readonly metrics: TypingMetrics;
  readonly bestCombo: number;
  readonly samples: readonly WpmSample[];
  /**
   * Writes the run to the results store when present.
   *
   * Games pass `undefined` so a play session never reaches test history, where
   * it would skew average WPM and the statistics page — while still earning XP
   * and achievements through the same path.
   */
  readonly persist?: { readonly config: TestConfig } | undefined;
  /** Ids from a caller-owned catalogue, unlocked alongside the test ones. */
  readonly extraUnlockedIds?: readonly string[] | undefined;
}

export interface UseRunPipelineResult {
  readonly completed: CompletedRun | null;
  readonly clear: () => void;
  readonly submit: (input: SubmitRunInput) => void;
}

export function useRunPipeline(): UseRunPipelineResult {
  const [completed, setCompleted] = useState<CompletedRun | null>(null);
  const { progress, record } = useProgress();

  const submit = useCallback(
    ({ metrics, bestCombo, samples, persist, extraUnlockedIds }: SubmitRunInput) => {
      void (async () => {
        const [priorResults, priorEntries] = await Promise.all([
          getAllResults().catch(() => []),
          getDailyEntries().catch(() => []),
        ]);
        const priorStats = aggregate(priorResults, priorEntries);

        if (persist) {
          void saveResult(metrics, persist.config, samples).catch(() => undefined);
        }

        // Re-read so a run that has just been persisted counts toward the
        // streak bonus it earned.
        const [results, entries] = await Promise.all([
          getAllResults().catch(() => priorResults),
          getDailyEntries().catch(() => priorEntries),
        ]);
        const statsAfter = aggregate(results, entries);

        const bestAccuracySeen = results.reduce(
          (best, result) => Math.max(best, result.accuracy),
          0,
        );

        // XP is written first so the achievement snapshot sees the new total.
        const provisional = scoreRun({
          metrics,
          bestCombo,
          priorStats,
          statsAfter,
          bestAccuracySeen,
          storedAfterXp: progress,
        });

        const stored = record({
          xpGained: provisional.award.total,
          bestCombo,
          currentStreak: statsAfter.currentStreak,
          unlockedIds: [],
          completedAt: Date.now(),
        });

        const { snapshot } = scoreRun({
          metrics,
          bestCombo,
          priorStats,
          statsAfter,
          bestAccuracySeen,
          storedAfterXp: stored,
        });

        const unlockedIds = [
          ...evaluateAchievements(snapshot),
          ...(extraUnlockedIds ?? []),
        ];

        if (unlockedIds.length > 0) {
          record({
            xpGained: 0,
            bestCombo,
            currentStreak: statsAfter.currentStreak,
            unlockedIds,
            completedAt: Date.now(),
          });
        }

        setCompleted({
          metrics,
          award: provisional.award,
          unlockedIds,
          levelsGained: levelsGained(progress.totalXp, provisional.award.total),
          bestCombo,
          isPersonalBest: provisional.isPersonalBest,
          streakDays: statsAfter.currentStreak,
        });
      })();
    },
    [record, progress],
  );

  const clear = useCallback(() => {
    setCompleted(null);
  }, []);

  return { completed, clear, submit };
}
