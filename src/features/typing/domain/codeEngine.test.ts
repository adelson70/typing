import { describe, expect, it } from 'vitest';

import {
  buildCodeCells,
  buildCodePrompt,
  canCommitLine,
  commitLine,
  createCodeState,
  isComplete,
  judgeChar,
  missedOnLine,
  typeChar,
  backspace,
} from './codeEngine';
import { CODE_SNIPPETS, getSnippetsFor, pickSnippet } from '../data/snippets';
import type { CodeSnippet } from '../data/snippets';

const snippet: CodeSnippet = {
  id: 'test',
  language: 'javascript',
  indentWidth: 2,
  lines: ['function f() {', '  return 1;', '}'],
};

const start = () => createCodeState(buildCodePrompt(snippet));

function typeText(state: ReturnType<typeof start>, text: string) {
  let next = state;
  for (const char of text) next = typeChar(next, char);
  return next;
}

describe('buildCodePrompt', () => {
  it('separates auto-inserted indentation from typed content', () => {
    const prompt = buildCodePrompt(snippet);

    expect(prompt.lines[1]?.indent).toBe('  ');
    expect(prompt.lines[1]?.content).toBe('return 1;');
    expect(prompt.lines[0]?.indent).toBe('');
  });

  it('preserves the original line for rendering', () => {
    expect(buildCodePrompt(snippet).lines[1]?.raw).toBe('  return 1;');
  });

  it('excludes indentation from the scorable character count', () => {
    // This is the rule that keeps code WPM comparable with prose WPM.
    const prompt = buildCodePrompt(snippet);
    const contentChars = 'function f() {'.length + 'return 1;'.length + '}'.length;
    const newlines = 2;

    expect(prompt.scorableChars).toBe(contentChars + newlines);
  });

  it('does not let indentation inflate the score', () => {
    // Two snippets with identical typed content but very different indentation
    // must be worth the same.
    const flat = buildCodePrompt({
      ...snippet,
      lines: ['a();', 'b();'],
    });
    const nested = buildCodePrompt({
      ...snippet,
      lines: ['            a();', '            b();'],
    });

    expect(nested.scorableChars).toBe(flat.scorableChars);
  });

  it('handles blank lines without inventing content', () => {
    const prompt = buildCodePrompt({ ...snippet, lines: ['a();', '', 'b();'] });

    expect(prompt.lines[1]?.content).toBe('');
    expect(prompt.lines[1]?.indent).toBe('');
  });
});

describe('character judgement', () => {
  it('accepts the expected character', () => {
    expect(judgeChar(start(), 'f')).toEqual({ correct: true, isExtra: false });
  });

  it('rejects a wrong character', () => {
    expect(judgeChar(start(), 'z')).toEqual({ correct: false, isExtra: false });
  });

  it('marks characters typed past the end of a line as extra', () => {
    const state = typeText(start(), 'function f() {');
    expect(judgeChar(state, 'x').isExtra).toBe(true);
  });

  it('judges against content, never against indentation', () => {
    // Line 2 is "  return 1;" — the player types 'r' first, not a space.
    const state = commitLine(typeText(start(), 'function f() {'));
    expect(judgeChar(state, 'r').correct).toBe(true);
    expect(judgeChar(state, ' ').correct).toBe(false);
  });
});

describe('line commitment', () => {
  it('refuses Enter before the line is finished', () => {
    // Otherwise Enter would be a way to skip a line's characters entirely.
    expect(canCommitLine(typeText(start(), 'function'))).toBe(false);
  });

  it('accepts Enter once the line content is typed', () => {
    expect(canCommitLine(typeText(start(), 'function f() {'))).toBe(true);
  });

  it('advances to the next line and clears the input', () => {
    const state = commitLine(typeText(start(), 'function f() {'));

    expect(state.lineIndex).toBe(1);
    expect(state.input).toBe('');
    expect(state.typedLines).toEqual(['function f() {']);
  });

  it('reports unreached characters as missed', () => {
    expect(missedOnLine(typeText(start(), 'func'))).toBe('tion f() {'.length);
  });

  it('completes once every line is committed', () => {
    let state = commitLine(typeText(start(), 'function f() {'));
    state = commitLine(typeText(state, 'return 1;'));
    state = commitLine(typeText(state, '}'));

    expect(isComplete(state)).toBe(true);
  });

  it('ignores input after completion', () => {
    let state = commitLine(typeText(start(), 'function f() {'));
    state = commitLine(typeText(state, 'return 1;'));
    state = commitLine(typeText(state, '}'));

    expect(typeChar(state, 'x')).toBe(state);
  });
});

describe('backspace', () => {
  it('removes the last character', () => {
    expect(backspace(typeText(start(), 'fun')).input).toBe('fu');
  });

  it('clears the line when asked', () => {
    expect(backspace(typeText(start(), 'fun'), true).input).toBe('');
  });

  it('never deletes into the previous line', () => {
    // Indentation is engine-supplied, so there is nothing before the content to
    // delete — backspacing at column zero must be a no-op.
    const state = commitLine(typeText(start(), 'function f() {'));
    expect(backspace(state).input).toBe('');
    expect(backspace(state).lineIndex).toBe(1);
  });
});

describe('buildCodeCells', () => {
  it('marks indentation with its own state', () => {
    const cells = buildCodeCells(start());
    expect(cells[1]?.indent.every((cell) => cell.state === 'indent')).toBe(true);
    expect(cells[1]?.indent).toHaveLength(2);
  });

  it('marks typed characters correct or incorrect', () => {
    const cells = buildCodeCells(typeText(start(), 'fun'));
    const line = cells[0];

    expect(line?.chars[0]?.state).toBe('correct');
    expect(line?.chars[2]?.state).toBe('correct');
    expect(line?.chars[3]?.state).toBe('pending');
  });

  it('flags the current line', () => {
    const cells = buildCodeCells(commitLine(typeText(start(), 'function f() {')));
    expect(cells[0]?.isComplete).toBe(true);
    expect(cells[1]?.isCurrent).toBe(true);
  });

  it('renders overtyped characters as extras', () => {
    const cells = buildCodeCells(typeText(start(), 'function f() {xx'));
    expect(cells[0]?.extras).toHaveLength(2);
  });
});

describe('snippet catalogue', () => {
  it('gives every snippet real structure', () => {
    // The differentiator: unlike keyword-bag code modes, every snippet must
    // contain genuine indentation and more than one line.
    for (const item of CODE_SNIPPETS) {
      expect(item.lines.length, item.id).toBeGreaterThan(1);
      expect(item.indentWidth, item.id).toBeGreaterThan(0);
    }

    const indented = CODE_SNIPPETS.filter((item) =>
      item.lines.some((line) => /^[ \t]+/.test(line)),
    );
    expect(indented.length).toBe(CODE_SNIPPETS.length);
  });

  it('has unique ids', () => {
    const ids = CODE_SNIPPETS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every advertised language', () => {
    for (const language of ['javascript', 'python', 'sql', 'html', 'css'] as const) {
      expect(getSnippetsFor(language).length, language).toBeGreaterThan(0);
    }
  });

  it('picks deterministically from a seed', () => {
    expect(pickSnippet('javascript', 7)?.id).toBe(pickSnippet('javascript', 7)?.id);
  });

  it('handles a negative seed without returning undefined', () => {
    expect(pickSnippet('python', -13)).toBeDefined();
  });
});
