import { useEffect, useState } from 'react';

import { t, type TranslationKey } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { formatDuration } from '../domain/metrics';
import type { TestConfig, TypingMetrics } from '../domain/types';
import { resolveAchievement } from '@/features/progression/domain/catalogue';
import { levelTitle } from '@/features/progression/domain/xp';
import type { LevelInfo, XpAward } from '@/features/progression/domain/types';

/** Everything the results screen needs about the run that just ended. */
export interface CompletedRun {
  readonly metrics: TypingMetrics;
  readonly award: XpAward;
  readonly unlockedIds: readonly string[];
  readonly levelsGained: readonly number[];
  readonly bestCombo: number;
  readonly isPersonalBest: boolean;
  readonly streakDays: number;
}

interface ResultsPanelProps {
  readonly locale: Locale;
  readonly run: CompletedRun;
  readonly mode: TestConfig['mode'];
  readonly limit: number;
  readonly level: LevelInfo;
  readonly onRestart: () => void;
}

/**
 * Post-test summary.
 *
 * Ordered by what the player most wants to know: the score, then what it earned
 * them, then the detail. The XP figure counts up rather than appearing —
 * a number that animates reads as something gained, where a static one reads as
 * a fact already true.
 */
export function ResultsPanel({
  locale,
  run,
  mode,
  limit,
  level,
  onRestart,
}: ResultsPanelProps) {
  const { metrics, award, unlockedIds, levelsGained, bestCombo, isPersonalBest } = run;

  const secondary: readonly { label: string; value: string }[] = [
    { label: t(locale, 'test.rawWpm'), value: String(Math.round(metrics.rawWpm)) },
    { label: t(locale, 'test.consistency'), value: `${Math.round(metrics.consistency)}%` },
    { label: t(locale, 'xp.bestCombo'), value: String(bestCombo) },
    {
      label: t(locale, 'test.errors'),
      value: String(metrics.incorrectChars + metrics.extraChars),
    },
    { label: t(locale, 'test.time'), value: formatDuration(metrics.elapsedMs) },
    {
      label: t(locale, 'test.mode'),
      value: mode === 'time' ? `${limit}s` : `${limit} ${t(locale, 'test.words')}`,
    },
  ];

  return (
    <section
      className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
      aria-label={t(locale, 'results.title')}
    >
      <h2 className="sr-only">{t(locale, 'results.title')}</h2>

      {/* Level-up takes the top slot when it happens: it is the rarest and most
          motivating thing that can appear here. */}
      {levelsGained.length > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-energy-muted px-5 py-4">
          <span className="text-2xl" aria-hidden="true">
            ⭐
          </span>
          <div>
            <p className="font-semibold text-energy">{t(locale, 'xp.levelUp')}</p>
            <p className="text-sm text-fg-muted">
              {t(locale, 'xp.newLevel').replace(
                '{n}',
                String(levelsGained[levelsGained.length - 1]),
              )}{' '}
              · {levelTitle(level.level)}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        <Headline label={t(locale, 'test.wpm')} value={Math.round(metrics.wpm)} />
        <Headline
          label={t(locale, 'test.accuracy')}
          value={`${Math.round(metrics.accuracy)}%`}
        />
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-subtle">
            {t(locale, 'xp.gained')}
          </p>
          <p className="mt-1 font-mono text-5xl font-bold tabular-nums text-energy">
            <CountUp to={award.total} />
          </p>
        </div>
      </div>

      {isPersonalBest && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-energy-muted px-3 py-1.5 text-sm font-medium text-energy">
          <span aria-hidden="true">🏆</span>
          {t(locale, 'test.personalBest')}
        </p>
      )}

      {unlockedIds.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
            {t(locale, 'xp.newAchievement')}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {unlockedIds.map((id) => {
              // Resolved against both catalogues: typing and game unlocks share
              // one stored list, and `getAchievement` alone would silently drop
              // every game achievement.
              const achievement = resolveAchievement(id);
              if (!achievement) return null;

              return (
                <li
                  key={id}
                  className="inline-flex items-center gap-2 rounded-lg border border-ember-700/40 bg-energy-muted px-3 py-2"
                >
                  <span aria-hidden="true">{achievement.icon}</span>
                  <span className="text-sm font-medium text-fg">
                    {t(locale, `ach.${id}` as TranslationKey)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* XP breakdown: an unexplained reward stops motivating, so every bonus
          states what earned it. */}
      {award.entries.length > 0 && (
        <details className="mt-6 group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg [&::-webkit-details-marker]:hidden">
            {t(locale, 'xp.breakdown')}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="transition-transform duration-normal group-open:rotate-180"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <dl className="mt-3 flex flex-col gap-1.5 rounded-lg bg-surface-sunken p-4">
            {award.entries.map((entry) => (
              <div key={entry.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-fg-muted">{entry.label}</dt>
                <dd className="font-mono text-sm tabular-nums text-energy">
                  +{entry.amount}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 sm:grid-cols-3">
        {secondary.map((item) => (
          <div key={item.label}>
            <dt className="text-xs uppercase tracking-wide text-fg-subtle">{item.label}</dt>
            <dd className="mt-1 font-mono text-lg tabular-nums text-fg">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-energy px-6 py-2.5 text-sm font-semibold text-energy-fg shadow-sm transition-[filter,transform] duration-fast hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t(locale, 'test.tryAgain')}
        </button>
        <p className="text-xs text-fg-subtle">{t(locale, 'results.saveHint')}</p>
      </div>
    </section>
  );
}

function Headline({ label, value }: { readonly label: string; readonly value: string | number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-fg-subtle">{label}</p>
      <p className="mt-1 font-mono text-5xl font-bold tabular-nums text-accent">{value}</p>
    </div>
  );
}

/**
 * Counts from zero to the target over a short interval.
 *
 * Honours `prefers-reduced-motion` by rendering the final value immediately —
 * the animation is decorative, and the number is the information.
 */
function CountUp({ to }: { readonly to: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (to <= 0) {
      setValue(0);
      return;
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setValue(to);
      return;
    }

    const DURATION = 700;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / DURATION);
      // Ease-out so the number decelerates into its final value.
      setValue(Math.round(to * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to]);

  return <>{value}</>;
}
