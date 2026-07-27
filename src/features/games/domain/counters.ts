/**
 * Adapting game counters to the shared metric functions.
 *
 * The whole point: a game run produces an honest `TypingCounters`, so
 * `computeMetrics` and `calculateXp` work unchanged and a game WPM means the
 * same thing a test WPM does.
 */

import type { TypingCounters } from '@/features/typing/domain/types';
import type { GameCounters } from './types';

export const EMPTY_GAME_COUNTERS: GameCounters = {
  correctChars: 0,
  incorrectChars: 0,
  extraChars: 0,
  missedChars: 0,
  totalKeystrokes: 0,
  wordsDestroyed: 0,
  wordsMissed: 0,
  combo: 0,
  bestCombo: 0,
};

/**
 * Characters of a word the player never reached.
 *
 * Mirrors `commitWord` in the typing engine exactly: a word you let fall is a
 * word you skipped, which is the situation `missedChars` exists for. This is
 * what stops letting the screen fill up from being free — accuracy has to
 * notice, or Word Rain XP would reward panic.
 */
export function missedCharsFor(word: string, typed: string): number {
  return Math.max(0, word.length - typed.length);
}

export function toTypingCounters(counters: GameCounters): TypingCounters {
  return {
    correctChars: counters.correctChars,
    incorrectChars: counters.incorrectChars,
    extraChars: counters.extraChars,
    missedChars: counters.missedChars,
    totalKeystrokes: counters.totalKeystrokes,
    correctWords: counters.wordsDestroyed,
    incorrectWords: counters.wordsMissed,
    combo: counters.combo,
    bestCombo: counters.bestCombo,
  };
}
