import type { Locale } from '@/constants/i18n';

/** Per-character comparison state, driving both rendering and scoring. */
export type CharState = 'pending' | 'correct' | 'incorrect' | 'extra';

export interface CharCell {
  readonly char: string;
  readonly state: CharState;
}

export interface WordCell {
  readonly chars: readonly CharCell[];
  /** Characters typed beyond the word's length (kept visible, counted as errors). */
  readonly extras: readonly CharCell[];
  readonly isComplete: boolean;
  readonly hasError: boolean;
}

export type TestMode = 'time' | 'words' | 'quote';

export type TestStatus = 'idle' | 'running' | 'finished';

export interface TestConfig {
  readonly mode: TestMode;
  /** Seconds for `time` mode; word count for `words` mode. Ignored for `quote`. */
  readonly limit: number;
  /** Content source id, e.g. `english-1k`, `javascript`, `numbers`. */
  readonly sourceId: string;
  readonly locale: Locale;
  /** Block advancing past an incorrect character. */
  readonly stopOnError: boolean;
}

/** One keystroke, retained for consistency and per-key analysis. */
export interface Keystroke {
  /** Milliseconds since test start. */
  readonly at: number;
  readonly expected: string;
  readonly actual: string;
  readonly correct: boolean;
}

/** A per-second sample used for the WPM graph and consistency. */
export interface WpmSample {
  readonly second: number;
  readonly wpm: number;
  readonly rawWpm: number;
  readonly errors: number;
}

/** Raw counters the engine maintains; all derived metrics compute from these. */
export interface TypingCounters {
  /** Characters matching the prompt at the moment they were typed. */
  readonly correctChars: number;
  /** Wrong characters typed. */
  readonly incorrectChars: number;
  /** Characters typed past the end of a word. */
  readonly extraChars: number;
  /** Prompt characters skipped by advancing early. */
  readonly missedChars: number;
  /** Every keypress, including corrections. */
  readonly totalKeystrokes: number;
  readonly correctWords: number;
  readonly incorrectWords: number;
  /** Consecutive correct characters right now. Resets to 0 on any error. */
  readonly combo: number;
  /** Highest combo reached during the test. */
  readonly bestCombo: number;
}

export interface TypingMetrics {
  /** Net WPM: correct characters / 5, per minute. The headline number. */
  readonly wpm: number;
  /** Gross WPM, ignoring correctness. */
  readonly rawWpm: number;
  /** Correct characters as a share of all typed characters. */
  readonly accuracy: number;
  /** Coefficient-of-variation-based evenness of speed, 0–100. */
  readonly consistency: number;
  readonly correctChars: number;
  readonly incorrectChars: number;
  readonly extraChars: number;
  readonly missedChars: number;
  readonly totalKeystrokes: number;
  readonly elapsedMs: number;
}

/** A persisted, completed test. */
export interface TestResult extends TypingMetrics {
  readonly id: string;
  readonly completedAt: number;
  readonly mode: TestMode;
  readonly limit: number;
  readonly sourceId: string;
  readonly locale: Locale;
  readonly samples: readonly WpmSample[];
}
