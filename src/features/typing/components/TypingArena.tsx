import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { t } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { getAllResults, getDailyEntries, aggregate } from '@/services/storage/resultsRepository';
import { loadSettings } from '@/services/storage/settings';
import { useTypingTest } from '../hooks/useTypingTest';
import { playKeySound, unlockAudio } from '../audio/keySound';
import type { TestConfig, TypingMetrics } from '../domain/types';
import type { EngineState } from '../domain/engine';
import { ResultsPanel } from './ResultsPanel';
import { SoundToggle } from './SoundToggle';
import { TypingLine } from './TypingLine';

import { useProgress } from '@/features/progression/hooks/useProgress';
import { useRunPipeline } from '@/features/progression/hooks/useRunPipeline';
import { ProgressHud } from '@/features/progression/components/ProgressHud';
import { ComboMeter } from '@/features/progression/components/ComboMeter';

interface TypingArenaProps {
  readonly locale: Locale;
  readonly mode: TestConfig['mode'];
  readonly limit: number;
  readonly sourceId: string;
  /**
   * Fixed prompt seed — used by the daily challenge.
   * Explicitly allows `undefined` so callers can pass a conditional value
   * under `exactOptionalPropertyTypes`.
   */
  readonly seed?: number | undefined;
}

/**
 * The interactive typing surface.
 *
 * The only meaningfully interactive island on a tool page, so it is the only
 * React component hydrated there. A hidden input owns focus so that mobile
 * keyboards open and IME composition works; the visible text is rendered from
 * engine state rather than from the input's value.
 */
export function TypingArena({ locale, mode, limit, sourceId, seed }: TypingArenaProps) {
  const [config, setConfig] = useState<TestConfig>(() => ({
    mode,
    limit,
    sourceId,
    locale,
    stopOnError: false,
  }));

  // Settings live in LocalStorage and are read after mount to keep the
  // server-rendered markup and the first client render identical.
  useEffect(() => {
    const settings = loadSettings();
    setSoundEnabled(settings.soundEnabled);
    setConfig((current) =>
      current.stopOnError === settings.stopOnError
        ? current
        : { ...current, stopOnError: settings.stopOnError },
    );
  }, []);

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [streak, setStreak] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { level, isReady } = useProgress();
  const { completed, clear, submit } = useRunPipeline();

  // The streak lives with test history, not progression, so it is read once on
  // mount rather than recomputed on every render.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [results, entries] = await Promise.all([getAllResults(), getDailyEntries()]);
      if (!cancelled) setStreak(aggregate(results, entries).currentStreak);
    })();
    return () => {
      cancelled = true;
    };
  }, [completed]);

  const handleFinish = useCallback(
    (metrics: TypingMetrics, state: EngineState) => {
      submit({
        metrics,
        bestCombo: state.counters.bestCombo,
        samples: state.samples,
        persist: { config },
      });
    },
    [config, submit],
  );

  const test = useTypingTest({
    config,
    ...(seed === undefined ? {} : { seed }),
    onFinish: handleFinish,
  });

  const { restart } = test;

  /**
   * Plays the keystroke sound, then forwards to the engine.
   *
   * Correctness is resolved against the prompt *before* dispatching, because
   * afterwards the engine has already advanced and the character that was just
   * judged is no longer the current one.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      if (soundEnabled) {
        // The first keystroke is the user gesture that unlocks audio.
        unlockAudio();

        const { key } = event;
        if (key === ' ') {
          playKeySound('space');
        } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const expected = test.state.words[test.state.wordIndex]?.[test.state.input.length];
          playKeySound(expected !== undefined && key === expected ? 'key' : 'error');
        }
      }

      test.handleKeyDown(event);
    },
    [soundEnabled, test],
  );

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  const handleRestart = useCallback(() => {
    clear();
    setResetKey((n) => n + 1);
    restart();
    focusInput();
  }, [clear, restart, focusInput]);

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

  const combo = test.state.counters.combo;
  const showTimer = config.mode === 'time';

  const hud = (
    <ProgressHud
      locale={locale}
      level={level}
      streak={streak}
      isReady={isReady}
      className="mb-4"
    />
  );

  if (completed) {
    return (
      <div>
        {hud}
        <ResultsPanel
          locale={locale}
          run={completed}
          mode={config.mode}
          limit={config.limit}
          level={level}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  return (
    <div>
      {hud}

      <section
        className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-6 lg:p-8"
        aria-label={t(locale, 'a11y.typingInput')}
      >
        {/* Ambient glow that intensifies with the combo. Pure decoration, so it
            is hidden from assistive tech and disabled under reduced motion. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-0 transition-opacity duration-slow motion-reduce:hidden"
          style={{
            opacity: Math.min(combo / 200, 0.5),
            background:
              'radial-gradient(ellipse at 50% 0%, var(--color-energy-glow), transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div
          className="relative mb-6 flex flex-wrap items-center justify-between gap-4"
          role="status"
          aria-live="polite"
          aria-label={t(locale, 'a11y.liveResults')}
        >
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-4xl font-bold tabular-nums text-accent">
              {showTimer ? (test.timeRemaining ?? 0) : Math.round(test.metrics.wpm)}
            </span>
            <span className="text-sm text-fg-muted">
              {showTimer ? t(locale, 'test.seconds') : t(locale, 'test.wpm')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ComboMeter locale={locale} combo={combo} />

            <dl className="flex items-center gap-5 text-sm">
              {showTimer && (
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-fg-subtle">{t(locale, 'test.wpm')}</dt>
                  <dd className="font-mono tabular-nums text-fg">
                    {Math.round(test.metrics.wpm)}
                  </dd>
                </div>
              )}
              <div className="flex items-baseline gap-1.5">
                <dt className="text-fg-subtle">{t(locale, 'test.accuracy')}</dt>
                <dd className="font-mono tabular-nums text-fg">
                  {`${Math.round(test.metrics.accuracy)}%`}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div
          className="relative mb-6 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-normal ease-out-quart"
            style={{ width: `${test.progress * 100}%` }}
          />
        </div>

        <div className="relative cursor-text" onClick={focusInput} role="presentation">
          <input
            ref={inputRef}
            type="text"
            className="absolute inset-0 size-full cursor-text opacity-0"
            value=""
            onChange={() => undefined}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label={t(locale, 'a11y.typingInput')}
          />

          <TypingLine
            cells={test.cells}
            input={test.input}
            isActive={test.status !== 'finished'}
            resetKey={resetKey}
          />

          {!isFocused && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="rounded-lg bg-surface-raised px-4 py-2 text-sm font-medium text-fg-muted shadow-sm">
                {t(locale, 'test.focusPrompt')}
              </span>
            </div>
          )}
        </div>

        <div className="relative mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors duration-fast hover:bg-surface-raised hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
            </svg>
            {t(locale, 'test.restart')}
          </button>

          <SoundToggle locale={locale} />
        </div>
      </section>
    </div>
  );
}

/**
 * The typing caret. `ts-caret` is targeted by the reduced-motion rule in
 * global.css, which stops the blink but keeps the caret visible.
 */
function Caret() {
  return (
    <span
      className="ts-caret absolute -left-px top-0 h-full w-0.5 animate-pulse rounded-full bg-type-caret"
      aria-hidden="true"
    />
  );
}
