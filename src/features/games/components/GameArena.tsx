import { useCallback, useEffect, useRef, useState } from 'react';

import { t } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { defaultSourceForLocale } from '@/features/typing/data/wordlists';
import { playKeySound, unlockAudio } from '@/features/typing/audio/keySound';
import { SoundToggle } from '@/features/typing/components/SoundToggle';
import { loadSettings } from '@/services/storage/settings';
import { resolveTarget } from '../domain/targeting';
import { useGame } from '../hooks/useGame';
import { usePrefersReducedMotion } from '../hooks/useGameLoop';
import type { GameId } from '../domain/types';
import { GameHud } from './GameHud';
import { GameOverPanel } from './GameOverPanel';
import { GameStage } from './GameStage';

interface GameArenaProps {
  readonly locale: Locale;
  readonly gameId: GameId;
  /** Defaults to the locale's wordlist, so pt-br plays in Portuguese. */
  readonly sourceId?: string | undefined;
}

/**
 * The one interactive island for every game.
 *
 * Input reuses the typing arena's hidden-input pattern rather than a window
 * listener — that is what opens a mobile keyboard, and a game nobody can play
 * on a phone is not worth shipping given how the traffic skews.
 */
export function GameArena({ locale, gameId, sourceId }: GameArenaProps) {
  const source = sourceId ?? defaultSourceForLocale(locale).id;

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const game = useGame({ gameId, locale, sourceId: source });

  // Settings live in LocalStorage and are read after mount, keeping the
  // server-rendered markup and the first client render identical.
  useEffect(() => {
    setSoundEnabled(loadSettings().soundEnabled);
  }, []);

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  useEffect(() => {
    if (!game.isOver) focusInput();
  }, [game.isOver, focusInput]);

  const { state, handleKeyDown: dispatchKey, restart, quit } = game;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      const { key } = event;

      // Correctness is resolved before dispatching, because afterwards the
      // engine has advanced and the character just judged is gone.
      if (soundEnabled && key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        unlockAudio();

        const { targetId, accepted } = resolveTarget(
          state.entities.map((entity) => ({
            id: entity.id,
            word: entity.word,
            y: entity.y,
            x: entity.x,
            typed: entity.typed,
          })),
          state.targetId,
          key,
          state.config.caseSensitive,
        );

        const target = state.entities.find((entity) => entity.id === targetId);
        // The last character of a word gets the heavier sound, so clearing one
        // is audible without watching the score.
        const clearsWord =
          accepted && target !== undefined && target.typed.length + 1 === target.word.length;

        playKeySound(accepted ? (clearsWord ? 'space' : 'key') : 'error');
      }

      dispatchKey(event);
    },
    [soundEnabled, state, dispatchKey],
  );

  const handleRestart = useCallback(() => {
    restart();
    focusInput();
  }, [restart, focusInput]);

  // Escape restarts, matching the typing arena so the two share one muscle
  // memory.
  useEffect(() => {
    const onGlobalKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleRestart();
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [handleRestart]);

  if (game.isOver) {
    return (
      <GameOverPanel
        locale={locale}
        state={state}
        metrics={game.metrics}
        award={game.award}
        unlockedIds={game.unlockedIds}
        isNewBest={game.isNewBest}
        tooShort={game.tooShort}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <section
      className="rounded-2xl border border-border bg-surface p-4 sm:p-6"
      aria-label={t(locale, 'game.stage')}
    >
      <GameHud locale={locale} state={state} wpm={game.metrics.wpm} bestScore={game.bestScore} />

      <div className="relative">
        <GameStage locale={locale} state={state} reducedMotion={reducedMotion} />

        {state.status === 'paused' && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-canvas/80">
            <div className="text-center">
              <p className="text-lg font-medium text-fg">{t(locale, 'game.paused')}</p>
              <p className="mt-1 text-sm text-fg-muted">{t(locale, 'game.pausedHint')}</p>
            </div>
          </div>
        )}

        {/* The real input: invisible, but focused, so mobile keyboards open and
            IME composition works. It covers the stage, so a tap anywhere on the
            board focuses it. */}
        <input
          ref={inputRef}
          type="text"
          value=""
          onChange={() => undefined}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 size-full cursor-text opacity-0"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label={t(locale, 'a11y.typingInput')}
        />

        {!isFocused && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="rounded-lg bg-canvas/90 px-4 py-2 text-sm text-fg-muted">
              {t(locale, 'game.startHint')}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <SoundToggle locale={locale} />
        <button
          type="button"
          onClick={quit}
          className="text-sm text-fg-muted underline underline-offset-4"
        >
          {t(locale, 'game.quit')}
        </button>
      </div>
    </section>
  );
}
