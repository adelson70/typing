import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { t } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { getAllResults, getDailyEntries, aggregate } from '@/services/storage/resultsRepository';
import { loadSettings } from '@/services/storage/settings';
import { useCodeTest } from '../hooks/useCodeTest';
import { playKeySound, unlockAudio } from '../audio/keySound';
import type { SnippetLanguage } from '../data/snippets';
import type { TestConfig, TypingMetrics, WpmSample } from '../domain/types';
import { TypingBlock } from './TypingBlock';
import { SoundToggle } from './SoundToggle';
import { ResultsPanel } from './ResultsPanel';

import { useProgress } from '@/features/progression/hooks/useProgress';
import { useRunPipeline } from '@/features/progression/hooks/useRunPipeline';
import { ProgressHud } from '@/features/progression/components/ProgressHud';
import { ComboMeter } from '@/features/progression/components/ComboMeter';

interface CodeArenaProps {
  readonly locale: Locale;
  readonly language: SnippetLanguage;
  readonly seed?: number | undefined;
}

/**
 * The code typing surface.
 *
 * Mirrors `TypingArena` but drives the line-aware engine, so indentation is
 * structural rather than typed. Everything downstream — metrics, XP,
 * achievements, history — is shared, because a code result is just a result.
 */
export function CodeArena({ locale, language, seed }: CodeArenaProps) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { level, isReady } = useProgress();
  const { completed, clear, submit } = useRunPipeline();

  useEffect(() => {
    setSoundEnabled(loadSettings().soundEnabled);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [results, entries] = await Promise.all([
        getAllResults().catch(() => []),
        getDailyEntries().catch(() => []),
      ]);
      if (!cancelled) setStreak(aggregate(results, entries).currentStreak);
    })();
    return () => {
      cancelled = true;
    };
  }, [completed]);

  const config: TestConfig = {
    mode: 'words',
    limit: 0,
    sourceId: language,
    locale,
    stopOnError: false,
  };

  const handleFinish = useCallback(
    (metrics: TypingMetrics, payload: { counters: { bestCombo: number }; samples: readonly WpmSample[] }) => {
      submit({
        metrics,
        bestCombo: payload.counters.bestCombo,
        samples: payload.samples,
        persist: { config },
      });
    },
    // `config` is rebuilt each render but is value-stable for a given language.
    [submit, language, locale],
  );

  const test = useCodeTest({
    language,
    ...(seed === undefined ? {} : { seed }),
    onFinish: handleFinish,
  });

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  const handleRestart = useCallback(() => {
    clear();
    setResetKey((n) => n + 1);
    test.restart();
    focusInput();
  }, [clear, test, focusInput]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      if (soundEnabled) {
        unlockAudio();
        const { key } = event;
        if (key === 'Enter') {
          playKeySound('space');
        } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const line = test.lines[test.lineIndex];
          const expected = line?.chars[test.input.length]?.char;
          playKeySound(expected !== undefined && key === expected ? 'key' : 'error');
        }
      }
      test.handleKeyDown(event);
    },
    [soundEnabled, test],
  );

  const combo = test.counters.combo;

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
          mode="words"
          limit={test.lines.length}
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
        className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-6"
        aria-label={t(locale, 'a11y.typingInput')}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 transition-opacity duration-slow motion-reduce:hidden"
          style={{
            opacity: Math.min(combo / 200, 0.5),
            background:
              'radial-gradient(ellipse at 50% 0%, var(--color-energy-glow), transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div
          className="relative mb-5 flex flex-wrap items-center justify-between gap-4"
          role="status"
          aria-live="polite"
          aria-label={t(locale, 'a11y.liveResults')}
        >
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-4xl font-bold tabular-nums text-accent">
              {Math.round(test.metrics.wpm)}
            </span>
            <span className="text-sm text-fg-muted">{t(locale, 'test.wpm')}</span>
          </div>

          <div className="flex items-center gap-4">
            <ComboMeter locale={locale} combo={combo} />
            <dl className="flex items-center gap-5 text-sm">
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
          className="relative mb-5 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
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

          {/* `key` on the error pulse retriggers the shake without a timer. */}
          <div key={test.errorPulse} className={cn(test.errorPulse > 0 && 'ts-shake')}>
            <TypingBlock
              lines={test.lines}
              input={test.input}
              lineIndex={test.lineIndex}
              isActive={test.status !== 'finished'}
              resetKey={resetKey}
            />
          </div>

          {!isFocused && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="rounded-lg bg-surface-raised px-4 py-2 text-sm font-medium text-fg-muted shadow-sm">
                {t(locale, 'test.focusPrompt')}
              </span>
            </div>
          )}
        </div>

        {/* Enter is the only non-obvious key in this mode, so it is stated
            rather than left to be discovered. */}
        <p className="relative mt-4 text-center text-xs text-fg-subtle">
          {t(locale, 'code.enterHint')}
        </p>

        <div className="relative mt-4 flex items-center justify-center gap-3">
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
