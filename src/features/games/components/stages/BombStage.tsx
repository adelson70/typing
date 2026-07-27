import { t } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { fuseMs } from '../../domain/difficulty';
import type { GameState } from '../../domain/types';

interface BombStageProps {
  readonly locale: Locale;
  readonly state: GameState;
  readonly reducedMotion: boolean;
}

/**
 * One bomb, one fuse.
 *
 * A single centred target, so there is no targeting to communicate — the whole
 * design job is making the remaining time legible at a glance while the player
 * is looking at the letters, not at the timer.
 */
export function BombStage({ locale, state, reducedMotion }: BombStageProps) {
  const active = state.entities[0];

  const armed = active ? fuseMs(state.level, active.word.length) : 0;
  const remaining = armed > 0 ? Math.max(0, state.fuseMs / armed) : 0;
  const seconds = (state.fuseMs / 1000).toFixed(1);

  // Under a fifth of the fuse, the bar earns the alarm colour. Before that it
  // would cry wolf on every word.
  const urgent = remaining < 0.2;

  return (
    <div className="relative flex h-[min(60vh,26rem)] flex-col items-center justify-center gap-8 rounded-xl bg-surface-raised">
      {active ? (
        <>
          {/* Per character, matching Word Rain: the next key is highlighted so
              the player's eye has one place to be. */}
          <p className="font-mono text-3xl sm:text-4xl" aria-hidden="true">
            {[...active.word].map((char, index) => {
              const isTyped = index < active.typed.length;
              const isNext = index === active.typed.length;

              return (
                <span
                  key={index}
                  className={
                    isTyped
                      ? 'text-accent opacity-40'
                      : isNext
                        ? 'rounded bg-accent px-1 font-bold text-accent-fg'
                        : 'text-fg'
                  }
                >
                  {char}
                </span>
              );
            })}
          </p>

          <div className="w-2/3 max-w-md">
            <div
              className="h-2 overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-valuenow={Math.round(remaining * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t(locale, 'game.fuse')}
            >
              <div
                className={
                  urgent
                    ? 'h-full bg-type-incorrect transition-[width] duration-fast'
                    : 'h-full bg-accent transition-[width] duration-fast'
                }
                style={{ width: `${remaining * 100}%` }}
              />
            </div>

            {/* The number was always the information; under reduced motion it
                becomes the only representation rather than a companion to a
                sweeping bar. */}
            <p
              className={
                reducedMotion
                  ? 'mt-3 text-center font-mono text-2xl tabular-nums text-fg'
                  : 'mt-2 text-center font-mono text-sm tabular-nums text-fg-muted'
              }
            >
              {seconds}s
            </p>
          </div>
        </>
      ) : (
        <p className="text-sm text-fg-subtle">{t(locale, 'game.startHint')}</p>
      )}
    </div>
  );
}
