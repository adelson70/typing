import { t, type TranslationKey } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { formatDuration } from '@/features/typing/domain/metrics';
import type { TypingMetrics } from '@/features/typing/domain/types';
import { resolveAchievement } from '@/features/progression/domain/catalogue';
import type { XpAward } from '@/features/progression/domain/types';
import type { EndReason, GameState } from '../domain/types';

interface GameOverPanelProps {
  readonly locale: Locale;
  readonly state: GameState;
  readonly metrics: TypingMetrics;
  readonly award: XpAward | null;
  readonly unlockedIds: readonly string[];
  readonly isNewBest: boolean;
  readonly tooShort: boolean;
  readonly onRestart: () => void;
}

const REASON_KEYS: Record<Exclude<EndReason, null>, TranslationKey> = {
  floor: 'game.endedFloor',
  error: 'game.endedError',
  timeout: 'game.endedTimeout',
  quit: 'game.endedQuit',
};

/**
 * Post-game summary.
 *
 * Ordered by what the player wants to know: the score, whether it beat their
 * record, then what it earned and what it cost. Game score comes first and WPM
 * second — inverting the typing test, because here the score is the point and
 * the typing metric is the diagnostic.
 */
export function GameOverPanel({
  locale,
  state,
  metrics,
  award,
  unlockedIds,
  isNewBest,
  tooShort,
  onRestart,
}: GameOverPanelProps) {
  const isSurvival = state.config.gameId === 'survival';
  const numberLocale = locale === 'pt-br' ? 'pt-BR' : 'en-US';

  const headline = isSurvival
    ? formatDuration(state.simulatedMs)
    : state.score.toLocaleString(numberLocale);

  const stats: readonly { label: string; value: string }[] = [
    { label: t(locale, 'test.wpm'), value: String(Math.round(metrics.wpm)) },
    { label: t(locale, 'test.accuracy'), value: `${Math.round(metrics.accuracy)}%` },
    { label: t(locale, 'game.wordsDestroyed'), value: String(state.counters.wordsDestroyed) },
    { label: t(locale, 'game.wordsMissed'), value: String(state.counters.wordsMissed) },
    { label: t(locale, 'xp.bestCombo'), value: String(state.counters.bestCombo) },
    { label: t(locale, 'game.level'), value: String(state.level) },
  ];

  return (
    <section
      className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
      aria-label={t(locale, 'game.gameOver')}
    >
      <p className="text-sm text-fg-muted">{t(locale, 'game.gameOver')}</p>

      <div className="mt-2 flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-5xl font-bold tabular-nums text-accent">{headline}</span>
        {/* `text-energy` on `bg-energy-muted`, matching the results panel —
            `energy-fg` is the pairing for a solid fill and washes out here. */}
        {isNewBest && (
          <span className="rounded-full bg-energy-muted px-3 py-1 text-sm font-medium text-energy">
            {t(locale, 'game.newBest')}
          </span>
        )}
      </div>

      {state.endReason && (
        <p className="mt-2 text-sm text-fg-muted">{t(locale, REASON_KEYS[state.endReason])}</p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-sm text-fg-subtle">{stat.label}</dt>
            <dd className="font-mono text-xl tabular-nums text-fg">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {tooShort ? (
        <p className="mt-6 text-sm text-fg-subtle">{t(locale, 'game.tooShort')}</p>
      ) : (
        award &&
        award.total > 0 && (
          <p className="mt-6 font-mono text-lg text-xp">+{award.total} XP</p>
        )
      )}

      {unlockedIds.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {unlockedIds.map((id) => {
            const achievement = resolveAchievement(id);
            if (!achievement) return null;

            return (
              <li
                key={id}
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm"
              >
                <span aria-hidden="true">{achievement.icon}</span>
                <span>{t(locale, `ach.${id}` as TranslationKey)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onRestart}
        className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg bg-energy px-6 py-2.5 text-sm font-semibold text-energy-fg shadow-sm transition-[filter,transform] duration-fast hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {t(locale, 'game.playAgain')}
      </button>
    </section>
  );
}
