/**
 * The single definition of "correct" for one keystroke.
 *
 * Extracted so the word engine, the code engine and every game agree on what a
 * correct character is. Without this, each consumer re-implements the same
 * three-line comparison and they drift — a game that judged case differently
 * from the typing test would report a WPM that means something else.
 */

export type CharVerdict = 'correct' | 'incorrect' | 'extra';

/**
 * Judges `actual` against the character `expected` holds at `position`.
 *
 * Typing past the end of the prompt is `extra` rather than `incorrect`: it is a
 * different mistake (a word not committed) and accuracy weighs it separately.
 */
export function judgeChar(expected: string, position: number, actual: string): CharVerdict {
  const target = expected[position];
  if (target === undefined) return 'extra';
  return actual === target ? 'correct' : 'incorrect';
}
