import { t } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { formatDuration } from '@/features/typing/domain/metrics';
import { livesLeft } from '../domain/modes/bombDefusal';
import type { GameState } from '../domain/types';

interface GameHudProps {
  readonly locale: Locale;
  readonly state: GameState;
  readonly wpm: number;
  readonly bestScore: number;
}

/**
 * The live readout above the stage.
 *
 * Rendered from state rather than from the loop, so it re-renders a few times a
 * second instead of sixty — the falling words are the only thing that needs
 * every frame.
 */
export function GameHud({ locale, state, wpm, bestScore }: GameHudProps) {
  const isSurvival = state.config.gameId === 'survival';
  const isBomb = state.config.gameId === 'bomb-defusal';

  const primary = isSurvival
    ? formatDuration(state.simulatedMs)
    : state.score.toLocaleString(locale === 'pt-br' ? 'pt-BR' : 'en-US');

  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-baseline gap-2 font-mono">
        <span className="text-4xl font-bold tabular-nums text-accent">{primary}</span>
        <span className="text-sm text-fg-muted">
          {isSurvival ? t(locale, 'game.survived') : t(locale, 'game.score')}
        </span>
      </div>

      <dl className="flex flex-wrap items-center gap-5 text-sm">
        <Stat label={t(locale, 'game.level')} value={String(state.level)} />
        <Stat label={t(locale, 'test.wpm')} value={String(Math.round(wpm))} />

        {isBomb && <Stat label={t(locale, 'game.lives')} value={'♥'.repeat(livesLeft(state))} />}

        {bestScore > 0 && (
          <Stat
            label={t(locale, 'game.best')}
            value={
              isSurvival
                ? formatDuration(bestScore)
                : bestScore.toLocaleString(locale === 'pt-br' ? 'pt-BR' : 'en-US')
            }
          />
        )}
      </dl>
    </div>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="font-mono tabular-nums text-fg">{value}</dd>
    </div>
  );
}
