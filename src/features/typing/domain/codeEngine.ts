/**
 * Code typing: line-aware prompt handling.
 *
 * Built as a layer over the word engine's vocabulary rather than a second engine,
 * so WPM, accuracy and consistency keep exactly one definition.
 *
 * The central rule, and the reason this module exists:
 *
 *   **Auto-inserted indentation is positioned for the player but never scored.**
 *
 * Enter drops the caret to the next line's indent depth — this avoids the browser
 * intercepting Tab, and avoids the complaint levelled at platforms that skip
 * whitespace wholesale, where typists lose the muscle memory they came to train.
 * But those spaces are not counted as correct characters. If they were, a snippet
 * that is 40% indentation would score far higher WPM than a dense one of the same
 * length, and code scores would stop being comparable with prose scores.
 */

import type { CodeSnippet } from '../data/snippets';
import { leadingWhitespace } from '../data/snippets';

export interface CodeLine {
  /** Whitespace the engine inserts on the player's behalf. */
  readonly indent: string;
  /** The part the player actually types. */
  readonly content: string;
  /** Original line, indent + content. */
  readonly raw: string;
}

export interface CodePrompt {
  readonly snippetId: string;
  readonly language: CodeSnippet['language'];
  readonly indentWidth: number;
  readonly lines: readonly CodeLine[];
  /** Characters the player is expected to type, excluding auto-indent. */
  readonly scorableChars: number;
}

/**
 * Splits a snippet into typed content and auto-inserted indentation.
 *
 * Blank lines carry no indent and no content: the player presses Enter and moves
 * on, which is what an editor does.
 */
export function buildCodePrompt(snippet: CodeSnippet): CodePrompt {
  const lines: CodeLine[] = snippet.lines.map((raw) => {
    const indent = leadingWhitespace(raw);
    return {
      indent,
      content: raw.slice(indent.length),
      raw,
    };
  });

  // Newlines count as scorable: pressing Enter is a real keystroke the player
  // makes. Indentation does not, because the engine supplies it.
  const contentChars = lines.reduce((sum, line) => sum + line.content.length, 0);
  const newlines = Math.max(0, lines.length - 1);

  return {
    snippetId: snippet.id,
    language: snippet.language,
    indentWidth: snippet.indentWidth,
    lines,
    scorableChars: contentChars + newlines,
  };
}

export interface CodeState {
  readonly prompt: CodePrompt;
  /** Index of the line being typed. */
  readonly lineIndex: number;
  /** What the player has typed on the current line, excluding its indent. */
  readonly input: string;
  /** Completed lines' typed content, for rendering history. */
  readonly typedLines: readonly string[];
}

export function createCodeState(prompt: CodePrompt): CodeState {
  return { prompt, lineIndex: 0, input: '', typedLines: [] };
}

export function currentLine(state: CodeState): CodeLine | undefined {
  return state.prompt.lines[state.lineIndex];
}

/** True once every line has been committed. */
export function isComplete(state: CodeState): boolean {
  return state.lineIndex >= state.prompt.lines.length;
}

export interface CharJudgement {
  readonly correct: boolean;
  /** Typed past the end of the line's content. */
  readonly isExtra: boolean;
}

/** Judges a character against the current line, without mutating state. */
export function judgeChar(state: CodeState, char: string): CharJudgement {
  const line = currentLine(state);
  if (!line) return { correct: false, isExtra: true };

  const expected = line.content[state.input.length];
  if (expected === undefined) return { correct: false, isExtra: true };

  return { correct: char === expected, isExtra: false };
}

/**
 * Whether Enter is currently valid.
 *
 * Accepted only once the line's content is fully typed, so Enter cannot be used
 * to skip past a line and dodge its characters.
 */
export function canCommitLine(state: CodeState): boolean {
  const line = currentLine(state);
  if (!line) return false;
  return state.input.length >= line.content.length;
}

/** Characters of the current line the player never reached. */
export function missedOnLine(state: CodeState): number {
  const line = currentLine(state);
  if (!line) return 0;
  return Math.max(0, line.content.length - state.input.length);
}

export function typeChar(state: CodeState, char: string): CodeState {
  if (isComplete(state)) return state;
  return { ...state, input: state.input + char };
}

export function backspace(state: CodeState, wholeWord = false): CodeState {
  if (state.input.length === 0) return state;
  return { ...state, input: wholeWord ? '' : state.input.slice(0, -1) };
}

/**
 * Commits the current line and moves to the next.
 *
 * The next line's indentation is supplied by the engine, not typed — the caret
 * simply starts after it.
 */
export function commitLine(state: CodeState): CodeState {
  if (isComplete(state)) return state;

  return {
    ...state,
    lineIndex: state.lineIndex + 1,
    input: '',
    typedLines: [...state.typedLines, state.input],
  };
}

/** Per-character render state for one line. */
export interface CodeCell {
  readonly char: string;
  readonly state: 'pending' | 'correct' | 'incorrect' | 'extra' | 'indent';
}

export interface CodeLineCells {
  readonly indent: readonly CodeCell[];
  readonly chars: readonly CodeCell[];
  readonly extras: readonly CodeCell[];
  readonly isCurrent: boolean;
  readonly isComplete: boolean;
}

/**
 * Projects state into renderable cells.
 *
 * Kept separate from the transitions so scoring never depends on presentation.
 * Indent cells carry their own state so the UI can show them as guides rather
 * than as characters awaiting input.
 */
export function buildCodeCells(state: CodeState): readonly CodeLineCells[] {
  return state.prompt.lines.map((line, index) => {
    const isPast = index < state.lineIndex;
    const isCurrent = index === state.lineIndex;
    const typed = isPast ? (state.typedLines[index] ?? '') : isCurrent ? state.input : '';

    const indent: CodeCell[] = [...line.indent].map((char) => ({
      char,
      state: 'indent' as const,
    }));

    const chars: CodeCell[] = [...line.content].map((char, charIndex) => {
      const typedChar = typed[charIndex];
      if (typedChar === undefined) {
        return { char, state: isPast ? 'incorrect' : 'pending' };
      }
      return { char, state: typedChar === char ? 'correct' : 'incorrect' };
    });

    const extras: CodeCell[] = [...typed.slice(line.content.length)].map((char) => ({
      char,
      state: 'extra' as const,
    }));

    return { indent, chars, extras, isCurrent, isComplete: isPast };
  });
}
