import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import {
  buildWordCells,
  createInitialState,
  elapsedMs,
  reduce,
  type EngineState,
} from '../domain/engine';
import { computeMetrics } from '../domain/metrics';
import { generateWords, wordCountForDuration } from '../domain/generator';
import type { TestConfig, TypingMetrics, WordCell } from '../domain/types';

export interface UseTypingTestOptions {
  readonly config: TestConfig;
  /** Fixed seed for reproducible prompts (daily challenge). */
  readonly seed?: number;
  readonly onFinish?: (metrics: TypingMetrics, state: EngineState) => void;
}

export interface UseTypingTestResult {
  readonly status: EngineState['status'];
  readonly cells: readonly WordCell[];
  readonly wordIndex: number;
  readonly input: string;
  readonly metrics: TypingMetrics;
  /** Seconds left in timed mode; null in other modes. */
  readonly timeRemaining: number | null;
  readonly progress: number;
  readonly state: EngineState;
  readonly handleKeyDown: (event: React.KeyboardEvent | KeyboardEvent) => void;
  readonly restart: () => void;
}

/** Words rendered ahead of the cursor. Enough to fill three lines. */
const VISIBLE_WORDS = 60;

function wordsForConfig(config: TestConfig, seed: number | undefined): readonly string[] {
  const count =
    config.mode === 'time' ? wordCountForDuration(config.limit) : config.limit;

  return generateWords({
    sourceId: config.sourceId,
    count,
    ...(seed === undefined ? {} : { seed }),
  });
}

/**
 * Drives a typing test from keyboard input.
 *
 * Timing comes from `performance.now()` rather than `Date.now()` — it is
 * monotonic, so a system clock adjustment mid-test cannot produce a negative
 * duration and an absurd WPM.
 */
export function useTypingTest(options: UseTypingTestOptions): UseTypingTestResult {
  const { config, seed, onFinish } = options;

  /**
   * Words start empty and are generated after mount.
   *
   * Generating during render would call `Date.now()` on the server and again on
   * the client, producing two different prompts and a hydration mismatch
   * (React #418) that discards the server-rendered HTML. A seeded test could
   * generate during render safely, but keeping one code path avoids the class
   * of bug entirely.
   */
  const [words, setWords] = useState<readonly string[]>([]);
  const [state, dispatch] = useReducer(
    reduce,
    undefined,
    () => createInitialState(config, []),
  );

  // Re-render once per second while running, so the timer and live WPM update
  // without the engine owning a clock.
  const [, forceTick] = useState(0);

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const hasReportedFinish = useRef(false);

  const restart = useCallback(() => {
    const next = wordsForConfig(config, seed);
    setWords(next);
    hasReportedFinish.current = false;
    dispatch({ type: 'reset', words: next });
  }, [config, seed]);

  // A config change (duration, source, mode) means a different test entirely.
  useEffect(() => {
    restart();
  }, [restart]);

  // Tick loop, active only while the test is running.
  useEffect(() => {
    if (state.status !== 'running') return;

    const id = window.setInterval(() => {
      dispatch({ type: 'tick', at: performance.now() });
      forceTick((n) => n + 1);
    }, 200);

    return () => window.clearInterval(id);
  }, [state.status]);

  // Report completion exactly once.
  useEffect(() => {
    if (state.status !== 'finished' || hasReportedFinish.current) return;

    hasReportedFinish.current = true;
    const metrics = computeMetrics(
      state.counters,
      state.samples,
      elapsedMs(state, performance.now()),
    );
    onFinishRef.current?.(metrics, state);
  }, [state]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      const { key } = event;

      // Let the browser handle shortcuts and navigation.
      if (event.ctrlKey && key !== 'Backspace') return;
      if (event.metaKey || event.altKey) return;

      if (key === 'Backspace') {
        event.preventDefault();
        dispatch({ type: 'backspace', at: performance.now(), ctrl: event.ctrlKey });
        return;
      }

      if (key === ' ') {
        // Always prevent default: space scrolls the page otherwise.
        event.preventDefault();
        dispatch({ type: 'space', at: performance.now() });
        return;
      }

      if (key === 'Escape') {
        event.preventDefault();
        restart();
        return;
      }

      // Printable characters only — `key` is a single grapheme for those, and
      // multi-character values ('Shift', 'ArrowLeft', 'F5') are ignored.
      if (key.length !== 1) return;

      event.preventDefault();
      dispatch({ type: 'type', char: key, at: performance.now() });
    },
    [restart],
  );

  const cells = useMemo(() => buildWordCells(state, VISIBLE_WORDS), [state]);

  const metrics = useMemo(
    () =>
      computeMetrics(
        state.counters,
        state.samples,
        elapsedMs(state, state.status === 'running' ? performance.now() : 0),
      ),
    // `samples` changes each second, which is the cadence we want for live stats.
    [state.counters, state.samples, state.status, state.startedAt, state.finishedAt],
  );

  const timeRemaining = useMemo(() => {
    if (config.mode !== 'time') return null;
    if (state.status === 'idle') return config.limit;

    const remaining =
      config.limit - elapsedMs(state, performance.now()) / 1000;
    return Math.max(0, Math.ceil(remaining));
  }, [config.mode, config.limit, state]);

  const progress = useMemo(() => {
    if (config.mode === 'time') {
      if (state.status === 'idle') return 0;
      return Math.min(1, elapsedMs(state, performance.now()) / (config.limit * 1000));
    }
    return words.length === 0 ? 0 : Math.min(1, state.wordIndex / words.length);
  }, [config.mode, config.limit, state, words.length]);

  return {
    status: state.status,
    cells,
    wordIndex: state.wordIndex,
    input: state.input,
    metrics,
    timeRemaining,
    progress,
    state,
    handleKeyDown,
    restart,
  };
}
