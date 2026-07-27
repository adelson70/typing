import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';
import { t, type TranslationKey } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { ACHIEVEMENTS, achievementProgress, nextAchievement } from '../domain/achievements';
import { ALL_ACHIEVEMENTS } from '../domain/catalogue';
import { levelFromXp, levelTitle } from '../domain/xp';
import type { AchievementTier, ProgressSnapshot } from '../domain/types';
import {
  GAME_ACHIEVEMENTS,
  gameAchievementProgress,
  toGameSnapshot,
  type GameSnapshot,
} from '@/features/games/domain/achievements';
import { loadGames } from '@/services/storage/gameRepository';
import { loadProgress } from '@/services/storage/progressRepository';
import {
  aggregate,
  getAllResults,
  getDailyEntries,
} from '@/services/storage/resultsRepository';

interface AchievementGridProps {
  readonly locale: Locale;
}

const TIER_STYLES: Record<AchievementTier, string> = {
  bronze: 'border-ember-800/50 bg-ember-950/30',
  silver: 'border-volt-700/50 bg-volt-950/30',
  gold: 'border-ember-500/50 bg-ember-900/30',
};

/**
 * Achievement showcase.
 *
 * Locked entries stay visible with their progress rather than being hidden.
 * A visible, partially-filled goal is what drives the goal-gradient effect;
 * hiding locked achievements removes the reason to pursue them.
 */
export function AchievementGrid({ locale }: AchievementGridProps) {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [games, setGames] = useState<GameSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [results, entries] = await Promise.all([
        getAllResults().catch(() => []),
        getDailyEntries().catch(() => []),
      ]);
      if (cancelled) return;

      const stats = aggregate(results, entries);
      const progress = loadProgress();
      const unlockedIds = progress.unlocked.map((entry) => entry.id);

      // Game milestones read from their own store — the progression snapshot is
      // a projection of test history and knows nothing about them.
      setGames(toGameSnapshot(loadGames(), unlockedIds));

      setSnapshot({
        totalXp: progress.totalXp,
        testsCompleted: stats.testsCompleted,
        bestWpm: stats.bestWpm,
        bestAccuracy: results.reduce((best, r) => Math.max(best, r.accuracy), 0),
        currentStreak: stats.currentStreak,
        longestStreak: progress.longestStreak,
        totalTimeMs: stats.totalTimeMs,
        bestCombo: progress.bestCombo,
        unlocked: progress.unlocked.map((entry) => entry.id),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!snapshot || !games) {
    return (
      <div
        className="h-96 animate-pulse rounded-2xl border border-border bg-surface"
        aria-busy="true"
      />
    );
  }

  const unlocked = new Set(snapshot.unlocked);
  const level = levelFromXp(snapshot.totalXp);
  const next = nextAchievement(snapshot);

  return (
    <div className="flex flex-col gap-8">
      {/* Level summary */}
      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-surface p-6">
        <div className="grid size-16 place-items-center rounded-xl bg-energy-muted font-mono text-2xl font-bold tabular-nums text-energy">
          {level.level}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-fg">{levelTitle(level.level)}</p>
          <p className="mt-0.5 font-mono text-sm tabular-nums text-fg-muted">
            {`${level.totalXp} ${t(locale, 'xp.xp')}`}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ember-500 to-ember-300"
              style={{ width: `${Math.round(level.progress * 100)}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-fg-subtle">
            {t(locale, 'xp.unlocked')}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-fg">
            {`${unlocked.size}/${ALL_ACHIEVEMENTS.length}`}
          </p>
        </div>
      </div>

      {/* Nearest goal — surfaced separately because a single visible target
          motivates more than a grid the player has to scan. */}
      {next && (
        <div className="rounded-xl border border-ember-700/40 bg-energy-muted p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
            {t(locale, 'xp.nextUp')}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              {next.achievement.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-fg">
                {t(locale, `ach.${next.achievement.id}` as TranslationKey)}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-energy transition-[width] duration-slow"
                  style={{ width: `${Math.round(next.progress * 100)}%` }}
                />
              </div>
            </div>
            <span className="font-mono text-sm tabular-nums text-energy">
              {`${Math.round(next.progress * 100)}%`}
            </span>
          </div>
        </div>
      )}

      {/* Full catalogue. Game achievements follow the typing ones and read
          their progress from the game store, since the two measure different
          things and share only the list of what has been unlocked. */}
      <ul className="ts-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...ACHIEVEMENTS, ...GAME_ACHIEVEMENTS].map((achievement, index) => {
          const isUnlocked = unlocked.has(achievement.id);
          const current = achievement.id.startsWith('game-')
            ? gameAchievementProgress(achievement.id, games)
            : achievementProgress(achievement.id, snapshot);
          const percent = Math.min(100, Math.round((current / achievement.target) * 100));

          return (
            <li
              key={achievement.id}
              style={{ '--ts-index': index } as React.CSSProperties}
              className={cn(
                'rounded-xl border p-4 transition-colors',
                isUnlocked
                  ? TIER_STYLES[achievement.tier]
                  : 'border-border bg-surface',
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn('text-2xl leading-none', !isUnlocked && 'opacity-30 grayscale')}
                  aria-hidden="true"
                >
                  {achievement.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isUnlocked ? 'text-fg' : 'text-fg-muted',
                    )}
                  >
                    {t(locale, `ach.${achievement.id}` as TranslationKey)}
                  </p>

                  {isUnlocked ? (
                    <p className="mt-1 text-xs font-medium text-energy">
                      {t(locale, 'xp.unlocked')}
                    </p>
                  ) : (
                    <>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className="h-full rounded-full bg-fg-subtle"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="mt-1.5 font-mono text-2xs tabular-nums text-fg-subtle">
                        {t(locale, 'xp.progressTo')
                          .replace('{current}', formatValue(achievement.id, current))
                          .replace('{target}', formatValue(achievement.id, achievement.target))}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Time-based achievements read as durations; everything else is a count. */
function formatValue(id: string, value: number): string {
  if (id.startsWith('time-')) {
    return `${Math.floor(value / 3_600_000)}h`;
  }
  // Survival targets are milliseconds but span minutes, so hours would round
  // every one of them to "0h".
  if (id.startsWith('game-survive-')) {
    return `${Math.floor(value / 1_000)}s`;
  }
  return String(Math.floor(value));
}
