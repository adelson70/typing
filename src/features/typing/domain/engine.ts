/**
 * The typing engine: a pure state machine over keystrokes.
 *
 * Deliberately free of React, timers and DOM. The caller supplies timestamps,
 * which makes every transition deterministic and testable — and lets the same
 * engine drive the UI, a replay viewer or a headless benchmark.
 *
 * Correctness rule: a character's score is fixed at the moment it is typed.
 * Backspacing to fix a mistake restores the *display*, but the original error
 * still counts against accuracy — otherwise accuracy would measure diligence in
 * correcting rather than skill in typing.
 */

import { judgeChar } from './judge';
import type {
  CharCell,
  Keystroke,
  TestConfig,
  TestStatus,
  TypingCounters,
  WordCell,
  WpmSample,
} from './types';

export interface EngineState {
  readonly status: TestStatus;
  readonly config: TestConfig;
  /** The prompt, split into words. */
  readonly words: readonly string[];
  /** Index of the word being typed. */
  readonly wordIndex: number;
  /** What the user has typed for the current word. */
  readonly input: string;
  /** Committed input for words already passed, for rendering history. */
  readonly typedWords: readonly string[];
  readonly counters: TypingCounters;
  readonly keystrokes: readonly Keystroke[];
  readonly samples: readonly WpmSample[];
  /** Timestamp of the first keystroke; null while idle. */
  readonly startedAt: number | null;
  readonly finishedAt: number | null;
}

export type EngineAction =
  | { readonly type: 'type'; readonly char: string; readonly at: number }
  | { readonly type: 'backspace'; readonly at: number; readonly ctrl?: boolean }
  | { readonly type: 'space'; readonly at: number }
  | { readonly type: 'tick'; readonly at: number }
  | { readonly type: 'finish'; readonly at: number }
  | { readonly type: 'reset'; readonly words?: readonly string[] };

/**
 * Compile-time exhaustiveness check. Reaching this at runtime means a variant
 * was added to `EngineAction` without a matching case.
 */
function assertNever(value: never): never {
  throw new Error(`Unhandled engine action: ${JSON.stringify(value)}`);
}

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

export function createInitialState(
  config: TestConfig,
  words: readonly string[],
): EngineState {
  return {
    status: 'idle',
    config,
    words,
    wordIndex: 0,
    input: '',
    typedWords: [],
    counters: EMPTY_COUNTERS,
    keystrokes: [],
    samples: [],
    startedAt: null,
    finishedAt: null,
  };
}

/** Elapsed milliseconds, safe to call in any status. */
export function elapsedMs(state: EngineState, now: number): number {
  if (state.startedAt === null) return 0;
  return (state.finishedAt ?? now) - state.startedAt;
}

/** True when the configured limit has been reached. */
function hasReachedLimit(state: EngineState, now: number): boolean {
  if (state.config.mode === 'time') {
    return elapsedMs(state, now) >= state.config.limit * 1000;
  }
  // `words` and `quote` end when the final word is committed.
  return state.wordIndex >= state.words.length;
}

function currentWord(state: EngineState): string {
  return state.words[state.wordIndex] ?? '';
}

/**
 * Scores the current word when the user commits it (space or end of test).
 *
 * Characters the user never reached count as `missed`, which is what stops
 * word-skipping from inflating accuracy.
 */
function commitWord(counters: TypingCounters, expected: string, typed: string): TypingCounters {
  const missed = Math.max(0, expected.length - typed.length);
  const isPerfect = typed === expected;

  return {
    ...counters,
    missedChars: counters.missedChars + missed,
    correctWords: counters.correctWords + (isPerfect ? 1 : 0),
    incorrectWords: counters.incorrectWords + (isPerfect ? 0 : 1),
  };
}

export function reduce(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case 'reset':
      return createInitialState(state.config, action.words ?? state.words);

    case 'type': {
      if (state.status === 'finished') return state;

      // The first keystroke starts the clock.
      const startedAt = state.startedAt ?? action.at;
      const word = currentWord(state);
      const position = state.input.length;
      const expected = word[position];
      const verdict = judgeChar(word, position, action.char);
      const isExtra = verdict === 'extra';
      const correct = verdict === 'correct';

      // `stopOnError` refuses input that would be wrong, but still records the
      // attempt so the error is reflected in accuracy.
      if (state.config.stopOnError && !correct) {
        return {
          ...state,
          status: 'running',
          startedAt,
          counters: {
            ...state.counters,
            incorrectChars: state.counters.incorrectChars + 1,
            totalKeystrokes: state.counters.totalKeystrokes + 1,
            // A refused keystroke is still a mistake, so it breaks the combo.
            combo: 0,
          },
          keystrokes: [
            ...state.keystrokes,
            {
              at: action.at - startedAt,
              expected: expected ?? '',
              actual: action.char,
              correct: false,
            },
          ],
        };
      }

      // The combo counts unbroken correct characters. Any wrong or extra
      // keystroke resets it, which is what makes it a measure of sustained
      // control rather than a second accuracy figure.
      const combo = correct ? state.counters.combo + 1 : 0;

      const counters: TypingCounters = {
        ...state.counters,
        correctChars: state.counters.correctChars + (correct ? 1 : 0),
        incorrectChars: state.counters.incorrectChars + (!correct && !isExtra ? 1 : 0),
        extraChars: state.counters.extraChars + (isExtra ? 1 : 0),
        totalKeystrokes: state.counters.totalKeystrokes + 1,
        combo,
        bestCombo: Math.max(state.counters.bestCombo, combo),
      };

      const next: EngineState = {
        ...state,
        status: 'running',
        startedAt,
        input: state.input + action.char,
        counters,
        keystrokes: [
          ...state.keystrokes,
          {
            at: action.at - startedAt,
            expected: expected ?? '',
            actual: action.char,
            correct,
          },
        ],
      };

      // Quote and word modes end on the last character of the last word.
      if (
        next.config.mode !== 'time' &&
        next.wordIndex === next.words.length - 1 &&
        next.input === word
      ) {
        return reduce(next, { type: 'finish', at: action.at });
      }

      return next;
    }

    case 'space': {
      if (state.status === 'finished') return state;
      // Leading spaces are ignored rather than counted as an empty word.
      if (state.input.length === 0) return state;

      const word = currentWord(state);
      const counters = commitWord(state.counters, word, state.input);
      const wordIndex = state.wordIndex + 1;

      const next: EngineState = {
        ...state,
        status: 'running',
        startedAt: state.startedAt ?? action.at,
        wordIndex,
        input: '',
        typedWords: [...state.typedWords, state.input],
        counters: {
          ...counters,
          // The space itself is a correct keystroke when the word was completed.
          correctChars: counters.correctChars + 1,
          totalKeystrokes: counters.totalKeystrokes + 1,
          // A perfectly typed word carries the combo through the space; an
          // imperfect one ends it here rather than at the next character.
          combo: state.input === word ? counters.combo + 1 : 0,
          bestCombo: Math.max(
            counters.bestCombo,
            state.input === word ? counters.combo + 1 : counters.combo,
          ),
        },
      };

      if (next.config.mode !== 'time' && wordIndex >= next.words.length) {
        return reduce(next, { type: 'finish', at: action.at });
      }

      return next;
    }

    case 'backspace': {
      if (state.status === 'finished' || state.input.length === 0) return state;

      // Ctrl+Backspace clears the whole word, matching editor conventions.
      return {
        ...state,
        input: action.ctrl ? '' : state.input.slice(0, -1),
      };
    }

    case 'tick': {
      if (state.status !== 'running' || state.startedAt === null) return state;

      const elapsed = action.at - state.startedAt;
      const second = Math.floor(elapsed / 1000);

      // One sample per second; ignore repeat ticks within the same second.
      const last = state.samples.at(-1);
      if (last && last.second >= second) {
        return hasReachedLimit(state, action.at)
          ? reduce(state, { type: 'finish', at: action.at })
          : state;
      }

      const typedChars =
        state.counters.correctChars +
        state.counters.incorrectChars +
        state.counters.extraChars;
      const minutes = elapsed / 60_000;

      const withSample: EngineState = {
        ...state,
        samples: [
          ...state.samples,
          {
            second,
            wpm: minutes > 0 ? state.counters.correctChars / 5 / minutes : 0,
            rawWpm: minutes > 0 ? typedChars / 5 / minutes : 0,
            errors: state.counters.incorrectChars,
          },
        ],
      };

      return hasReachedLimit(withSample, action.at)
        ? reduce(withSample, { type: 'finish', at: action.at })
        : withSample;
    }

    case 'finish': {
      if (state.status === 'finished') return state;

      // Score any partially-typed word so trailing input is not silently lost.
      const counters =
        state.input.length > 0
          ? commitWord(state.counters, currentWord(state), state.input)
          : state.counters;

      return {
        ...state,
        status: 'finished',
        counters,
        finishedAt: action.at,
        startedAt: state.startedAt ?? action.at,
      };
    }

    default: {
      // Exhaustiveness guard: adding an action variant without handling it
      // above makes this assignment fail to compile.
      return assertNever(action);
    }
  }
}

/**
 * Projects engine state into renderable cells.
 *
 * Kept separate from `reduce` so scoring never depends on presentation, and so
 * the view can re-derive cheaply without the engine tracking view concerns.
 */
export function buildWordCells(state: EngineState, visibleWords: number): readonly WordCell[] {
  const cells: WordCell[] = [];
  const end = Math.min(state.words.length, state.wordIndex + visibleWords);

  for (let i = state.wordIndex === 0 ? 0 : state.wordIndex; i < end; i += 1) {
    const word = state.words[i] ?? '';
    const typed = i < state.wordIndex ? (state.typedWords[i] ?? '') : i === state.wordIndex ? state.input : '';
    const isPast = i < state.wordIndex;
    const isCurrent = i === state.wordIndex;

    const chars: CharCell[] = [...word].map((char, index) => {
      const typedChar = typed[index];
      if (typedChar === undefined) {
        return { char, state: isPast ? 'incorrect' : 'pending' };
      }
      return { char, state: typedChar === char ? 'correct' : 'incorrect' };
    });

    const extras: CharCell[] = [...typed.slice(word.length)].map((char) => ({
      char,
      state: 'extra' as const,
    }));

    cells.push({
      chars,
      extras,
      isComplete: isPast,
      hasError:
        (isPast || isCurrent) &&
        (extras.length > 0 || chars.some((c) => c.state === 'incorrect')),
    });
  }

  return cells;
}
