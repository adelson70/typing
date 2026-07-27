import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { t } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { levelTitle } from '../domain/xp';
import type { LevelInfo } from '../domain/types';

interface ProgressHudProps {
  readonly locale: Locale;
  readonly level: LevelInfo;
  readonly streak: number;
  readonly isReady: boolean;
  readonly className?: string;
}

/**
 * The persistent progression bar.
 *
 * Sits above the typing arena so the player sees how close the next level is
 * *before* deciding whether to run another test — the goal-gradient effect only
 * works if the remaining distance is visible at the moment of that decision.
 *
 * The bar keeps its exact dimensions before data loads, so nothing shifts when
 * the real values arrive.
 */
export function ProgressHud({ locale, level, streak, isReady, className }: ProgressHudProps) {
  const percent = Math.round(level.progress * 100);
  const remaining = Math.max(0, level.xpForNextLevel - level.xpIntoLevel);

  // A highlight sweeps the bar when the level number actually increases.
  const previousLevel = useRef(level.level);
  const [levelUp, setLevelUp] = useState(0);

  useEffect(() => {
    if (isReady && level.level > previousLevel.current) setLevelUp((n) => n + 1);
    previousLevel.current = level.level;
  }, [level.level, isReady]);

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3',
        className,
      )}
    >
      {/* Level badge */}
      <div className="flex shrink-0 items-center gap-2.5">
        <div
          className="grid size-11 place-items-center rounded-lg bg-energy-muted font-mono text-lg font-bold tabular-nums text-energy"
          aria-hidden="true"
        >
          {isReady ? level.level : '—'}
        </div>
        <div className="hidden sm:block">
          <p className="text-2xs font-medium uppercase tracking-wider text-fg-subtle">
            {t(locale, 'xp.level')}
          </p>
          <p className="text-sm font-semibold text-fg">
            {isReady ? levelTitle(level.level) : ' '}
          </p>
        </div>
      </div>

      {/* XP bar */}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="font-mono text-xs tabular-nums text-fg-muted">
            {isReady ? `${level.xpIntoLevel} / ${level.xpForNextLevel} XP` : ' '}
          </span>
          <span className="hidden truncate text-xs text-fg-subtle sm:inline">
            {isReady
              ? `${remaining} ${t(locale, 'xp.toNextLevel').replace('{n}', String(level.level + 1))}`
              : ' '}
          </span>
        </div>

        <div
          key={levelUp}
          className={cn(
            'relative h-2.5 overflow-hidden rounded-full bg-surface-sunken',
            levelUp > 0 && 'ts-sweep',
          )}
          role="progressbar"
          aria-valuenow={isReady ? percent : 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${t(locale, 'xp.level')} ${level.level}`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-ember-500 to-ember-300 transition-[width] duration-slow ease-out-quart"
            style={{ width: isReady ? `${percent}%` : '0%' }}
          />
        </div>
      </div>

      {/* Streak. Rendered even at zero — an empty slot is an invitation, and
          hiding it would remove the prompt that starts the habit. */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors',
          streak > 0 ? 'bg-energy-muted' : 'bg-surface-sunken',
        )}
        title={streak > 0 ? t(locale, 'xp.streakKeep') : t(locale, 'xp.streakStart')}
      >
        <span
          className={cn(
            'text-base leading-none',
            streak === 0 && 'opacity-40 grayscale',
            streak > 0 && isReady && 'ts-flame',
          )}
          aria-hidden="true"
        >
          🔥
        </span>
        <span
          className={cn(
            'font-mono text-sm font-bold tabular-nums',
            streak > 0 ? 'text-streak' : 'text-fg-subtle',
          )}
        >
          {isReady ? streak : '—'}
        </span>
        <span className="sr-only">{t(locale, 'xp.streak')}</span>
      </div>
    </div>
  );
}
