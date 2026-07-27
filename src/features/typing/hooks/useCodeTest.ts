import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { computeMetrics } from '../domain/metrics';
import { hashSeed } from '../domain/generator';
import { pickSnippet, type SnippetLanguage } from '../data/snippets';
import {
  backspace,
  buildCodeCells,
  buildCodePrompt,
  canCommitLine,
  commitLine,
  createCodeState,
  currentLine,
  isComplete,
  judgeChar,
  missedOnLine,
  typeChar,
  type CodeLineCells,
  type CodeState,
} from '../domain/codeEngine';
import type { TypingCounters, TypingMetrics, WpmSample } from '../domain/types';

/** Counters mirror the word engine's so metrics have one definition. */
const EMPTY_COUNTERS: TypingCounters = {
  correctChars: 0,
  incorrectChars: 0,
  extraChars: 0,
  missedChars: 0,
  totalKeystrokes: 0,
  correctWords: 0,
  incorrectWords: 0,
  combo: 0,
  bestCombo: 0,
};

interface State {
  readonly code: CodeState;
  readonly counters: TypingCounters;
  readonly samples: readonly WpmSample[];
  readonly startedAt: number | null;
  readonly finishedAt: number | null;
  readonly status: 'idle' | 'running' | 'finished';
  /** Bumped on an error so the view can retrigger the shake animation. */
  readonly errorPulse: number;
}

type Action =
  | { readonly type: 'char'; readonly char: string; readonly at: number }
  | { readonly type: 'enter'; readonly at: number }
  | { readonly type: 'backspace'; readonly ctrl: boolean }
  | { readonly type: 'tick'; readonly at: number }
  | { readonly type: 'reset'; readonly code: CodeState };

function reduce(state: State, action: Action): State {
  switch (action.type) {
    case 'reset':
      return {
        code: action.code,
        counters: EMPTY_COUNTERS,
        samples: [],
        startedAt: null,
        finishedAt: null,
        status: 'idle',
        errorPulse: 0,
      };

    case 'char': {
      if (state.status === 'finished') return state;

      const { correct, isExtra } = judgeChar(state.code, action.char);
      const combo = correct ? state.counters.combo + 1 : 0;

      return {
        ...state,
        status: 'running',
        startedAt: state.startedAt ?? action.at,
        code: typeChar(state.code, action.char),
        counters: {
          ...state.counters,
          correctChars: state.counters.correctChars + (correct ? 1 : 0),
          incorrectChars: state.counters.incorrectChars + (!correct && !isExtra ? 1 : 0),
          extraChars: state.counters.extraChars + (isExtra ? 1 : 0),
          totalKeystrokes: state.counters.totalKeystrokes + 1,
          combo,
          bestCombo: Math.max(state.counters.bestCombo, combo),
        },
        errorPulse: correct ? state.errorPulse : state.errorPulse + 1,
      };
    }

    case 'enter': {
      if (state.status === 'finished') return state;

      // Enter before the line is finished is refused, so it cannot be used to
      // skip a line's characters. The attempt still breaks the combo.
      if (!canCommitLine(state.code)) {
        return {
          ...state,
          status: 'running',
          startedAt: state.startedAt ?? action.at,
          counters: { ...state.counters, combo: 0 },
          errorPulse: state.errorPulse + 1,
        };
      }

      const missed = missedOnLine(state.code);
      const line = currentLine(state.code);
      const isPerfect = line !== undefined && state.code.input === line.content;
      const next = commitLine(state.code);

      const counters: TypingCounters = {
        ...state.counters,
        missedChars: state.counters.missedChars + missed,
        // The newline itself is a real keystroke, so it scores.
        correctChars: state.counters.correctChars + 1,
        totalKeystrokes: state.counters.totalKeystrokes + 1,
        correctWords: state.counters.correctWords + (isPerfect ? 1 : 0),
        incorrectWords: state.counters.incorrectWords + (isPerfect ? 0 : 1),
        combo: isPerfect ? state.counters.combo + 1 : 0,
        bestCombo: Math.max(
          state.counters.bestCombo,
          isPerfect ? state.counters.combo + 1 : state.counters.combo,
        ),
      };

      const finished = isComplete(next);

      return {
        ...state,
        status: finished ? 'finished' : 'running',
        startedAt: state.startedAt ?? action.at,
        finishedAt: finished ? action.at : null,
        code: next,
        counters,
      };
    }

    case 'backspace':
      if (state.status === 'finished') return state;
      return { ...state, code: backspace(state.code, action.ctrl) };

    case 'tick': {
      if (state.status !== 'running' || state.startedAt === null) return state;

      const elapsed = action.at - state.startedAt;
      const second = Math.floor(elapsed / 1000);
      const last = state.samples.at(-1);
      if (last && last.second >= second) return state;

      const typed =
        state.counters.correctChars +
        state.counters.incorrectChars +
        state.counters.extraChars;
      const minutes = elapsed / 60_000;

      return {
        ...state,
        samples: [
          ...state.samples,
          {
            second,
            wpm: minutes > 0 ? state.counters.correctChars / 5 / minutes : 0,
            rawWpm: minutes > 0 ? typed / 5 / minutes : 0,
            errors: state.counters.incorrectChars,
          },
        ],
      };
    }

    default: {
      const never: never = action;
      throw new Error(`Unhandled code action: ${JSON.stringify(never)}`);
    }
  }
}

export interface UseCodeTestOptions {
  readonly language: SnippetLanguage;
  readonly seed?: number | undefined;
  readonly onFinish?: (
    metrics: TypingMetrics,
    payload: { counters: TypingCounters; samples: readonly WpmSample[] },
  ) => void;
}

export interface UseCodeTestResult {
  readonly status: State['status'];
  readonly lines: readonly CodeLineCells[];
  readonly lineIndex: number;
  readonly input: string;
  readonly metrics: TypingMetrics;
  readonly counters: TypingCounters;
  readonly progress: number;
  readonly errorPulse: number;
  readonly samples: readonly WpmSample[];
  readonly handleKeyDown: (event: React.KeyboardEvent | KeyboardEvent) => void;
  readonly restart: () => void;
}

/**
 * Drives a code typing test.
 *
 * Separate from `useTypingTest` because the prompt shape genuinely differs —
 * lines with auto-inserted indentation rather than space-separated words — but
 * it produces the same `TypingMetrics`, so results, XP and history need no
 * knowledge of which mode produced them.
 */
export function useCodeTest(options: UseCodeTestOptions): UseCodeTestResult {
  const { language, seed, onFinish } = options;

  const makeState = useCallback((): CodeState => {
    const resolved = seed ?? hashSeed(`${Date.now()}-${language}`);
    const snippet = pickSnippet(language, resolved);
    // An unknown language yields an empty prompt rather than throwing; the arena
    // renders nothing and the page stays usable.
    return createCodeState(
      buildCodePrompt(snippet ?? { id: 'empty', language, indentWidth: 2, lines: [] }),
    );
  }, [language, seed]);

  const [state, dispatch] = useReducer(reduce, undefined, () => ({
    code: createCodeState(buildCodePrompt({ id: 'empty', language, indentWidth: 2, lines: [] })),
    counters: EMPTY_COUNTERS,
    samples: [] as readonly WpmSample[],
    startedAt: null,
    finishedAt: null,
    status: 'idle' as const,
    errorPulse: 0,
  }));

  // The snippet is chosen after mount for the same reason the word list is:
  // choosing during render would use `Date.now()` on both server and client and
  // produce a hydration mismatch.
  useEffect(() => {
    dispatch({ type: 'reset', code: makeState() });
  }, [makeState]);

  const [, forceTick] = useState(0);

  useEffect(() => {
    if (state.status !== 'running') return;
    const id = window.setInterval(() => {
      dispatch({ type: 'tick', at: performance.now() });
      forceTick((n) => n + 1);
    }, 200);
    return () => window.clearInterval(id);
  }, [state.status]);

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const reported = useRef(false);

  const elapsed =
    state.startedAt === null ? 0 : (state.finishedAt ?? performance.now()) - state.startedAt;

  useEffect(() => {
    if (state.status !== 'finished' || reported.current) return;
    reported.current = true;

    const finalElapsed =
      state.startedAt === null ? 0 : (state.finishedAt ?? 0) - state.startedAt;

    onFinishRef.current?.(computeMetrics(state.counters, state.samples, finalElapsed), {
      counters: state.counters,
      samples: state.samples,
    });
  }, [state]);

  const restart = useCallback(() => {
    reported.current = false;
    dispatch({ type: 'reset', code: makeState() });
  }, [makeState]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      const { key } = event;

      if (event.metaKey || event.altKey) return;
      if (event.ctrlKey && key !== 'Backspace') return;

      if (key === 'Backspace') {
        event.preventDefault();
        dispatch({ type: 'backspace', ctrl: event.ctrlKey });
        return;
      }

      if (key === 'Enter') {
        event.preventDefault();
        dispatch({ type: 'enter', at: performance.now() });
        return;
      }

      if (key === 'Tab') {
        // Swallowed deliberately: indentation is auto-inserted, and letting Tab
        // through would move focus out of the arena mid-test.
        event.preventDefault();
        return;
      }

      if (key === 'Escape') {
        event.preventDefault();
        restart();
        return;
      }

      if (key.length !== 1) return;

      event.preventDefault();
      dispatch({ type: 'char', char: key, at: performance.now() });
    },
    [restart],
  );

  const lines = useMemo(() => buildCodeCells(state.code), [state.code]);

  const metrics = useMemo(
    () => computeMetrics(state.counters, state.samples, elapsed),
    [state.counters, state.samples, elapsed],
  );

  const total = state.code.prompt.lines.length;
  const progress = total === 0 ? 0 : Math.min(1, state.code.lineIndex / total);

  return {
    status: state.status,
    lines,
    lineIndex: state.code.lineIndex,
    input: state.code.input,
    metrics,
    counters: state.counters,
    progress,
    errorPulse: state.errorPulse,
    samples: state.samples,
    handleKeyDown,
    restart,
  };
}
