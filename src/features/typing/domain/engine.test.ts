import { describe, expect, it } from 'vitest';

import { createInitialState, elapsedMs, reduce, type EngineState } from './engine';
import type { TestConfig } from './types';

const config = (overrides: Partial<TestConfig> = {}): TestConfig => ({
  mode: 'words',
  limit: 3,
  sourceId: 'test',
  locale: 'en',
  stopOnError: false,
  ...overrides,
});

const WORDS = ['the', 'quick', 'fox'] as const;

const setup = (overrides: Partial<TestConfig> = {}, words: readonly string[] = WORDS) =>
  createInitialState(config(overrides), words);

/** Types a string one character at a time, advancing the clock by 100ms. */
function typeText(state: EngineState, text: string, startAt = 1_000): EngineState {
  let next = state;
  let at = startAt;
  for (const char of text) {
    next = char === ' '
      ? reduce(next, { type: 'space', at })
      : reduce(next, { type: 'type', char, at });
    at += 100;
  }
  return next;
}

describe('engine lifecycle', () => {
  it('starts idle and begins running on the first keystroke', () => {
    const initial = setup();
    expect(initial.status).toBe('idle');
    expect(initial.startedAt).toBeNull();

    const next = reduce(initial, { type: 'type', char: 't', at: 500 });
    expect(next.status).toBe('running');
    expect(next.startedAt).toBe(500);
  });

  it('measures elapsed time from the first keystroke, not from construction', () => {
    const state = reduce(setup(), { type: 'type', char: 't', at: 5_000 });
    expect(elapsedMs(state, 8_000)).toBe(3_000);
  });

  it('reports zero elapsed time while idle', () => {
    expect(elapsedMs(setup(), 9_999)).toBe(0);
  });
});

describe('character scoring', () => {
  it('counts matching characters as correct', () => {
    const state = typeText(setup(), 'the');
    expect(state.counters.correctChars).toBe(3);
    expect(state.counters.incorrectChars).toBe(0);
  });

  it('counts mismatched characters as incorrect', () => {
    const state = typeText(setup(), 'thx');
    expect(state.counters.correctChars).toBe(2);
    expect(state.counters.incorrectChars).toBe(1);
  });

  it('counts characters typed past a word as extra', () => {
    const state = typeText(setup(), 'thexx');
    expect(state.counters.correctChars).toBe(3);
    expect(state.counters.extraChars).toBe(2);
  });

  it('keeps the original error after a backspace correction', () => {
    // This is the rule that stops accuracy from measuring diligence at fixing
    // mistakes rather than typing skill.
    let state = typeText(setup(), 'thx');
    state = reduce(state, { type: 'backspace', at: 2_000 });
    state = reduce(state, { type: 'type', char: 'e', at: 2_100 });

    expect(state.input).toBe('the');
    expect(state.counters.incorrectChars).toBe(1);
  });

  it('clears the whole word on ctrl+backspace', () => {
    let state = typeText(setup(), 'the');
    state = reduce(state, { type: 'backspace', at: 2_000, ctrl: true });
    expect(state.input).toBe('');
  });

  it('ignores backspace when there is nothing to delete', () => {
    const state = reduce(setup(), { type: 'backspace', at: 1_000 });
    expect(state.input).toBe('');
    expect(state.status).toBe('idle');
  });
});

describe('word commitment', () => {
  it('advances to the next word on space', () => {
    const state = typeText(setup(), 'the ');
    expect(state.wordIndex).toBe(1);
    expect(state.input).toBe('');
    expect(state.typedWords).toEqual(['the']);
  });

  it('ignores a leading space', () => {
    const state = reduce(setup(), { type: 'space', at: 1_000 });
    expect(state.wordIndex).toBe(0);
    expect(state.status).toBe('idle');
  });

  it('counts unreached characters as missed when a word is skipped', () => {
    // Typing "qu" then space skips the remaining "ick".
    const state = typeText(setup(), 'the qu ');
    expect(state.counters.missedChars).toBe(3);
  });

  it('tracks perfect and imperfect words separately', () => {
    const state = typeText(setup(), 'the quikc ');
    expect(state.counters.correctWords).toBe(1);
    expect(state.counters.incorrectWords).toBe(1);
  });
});

describe('stopOnError', () => {
  it('refuses the wrong character but still records the error', () => {
    const state = typeText(setup({ stopOnError: true }), 'tx');
    expect(state.input).toBe('t');
    expect(state.counters.incorrectChars).toBe(1);
  });

  it('accepts the correct character afterwards', () => {
    let state = typeText(setup({ stopOnError: true }), 'tx');
    state = reduce(state, { type: 'type', char: 'h', at: 3_000 });
    expect(state.input).toBe('th');
  });
});

describe('completion', () => {
  it('finishes word mode on the last character of the last word', () => {
    const state = typeText(setup(), 'the quick fox');
    expect(state.status).toBe('finished');
    expect(state.finishedAt).not.toBeNull();
  });

  it('scores a partially typed word when the test ends', () => {
    let state = typeText(setup({ mode: 'time', limit: 60 }), 'the qui');
    state = reduce(state, { type: 'finish', at: 10_000 });

    expect(state.status).toBe('finished');
    // "quick" had 5 chars, 3 typed => 2 missed.
    expect(state.counters.missedChars).toBe(2);
  });

  it('ignores further input once finished', () => {
    let state = typeText(setup(), 'the quick fox');
    const chars = state.counters.correctChars;
    state = reduce(state, { type: 'type', char: 'z', at: 99_000 });

    expect(state.counters.correctChars).toBe(chars);
  });

  it('is idempotent', () => {
    let state = typeText(setup(), 'the quick fox');
    const first = state.finishedAt;
    state = reduce(state, { type: 'finish', at: 99_000 });
    expect(state.finishedAt).toBe(first);
  });
});

describe('time mode', () => {
  it('finishes once the limit elapses', () => {
    let state = typeText(setup({ mode: 'time', limit: 5 }), 'the');
    // First keystroke was at 1000ms, so 5s expires at 6000ms.
    state = reduce(state, { type: 'tick', at: 6_500 });
    expect(state.status).toBe('finished');
  });

  it('keeps running before the limit', () => {
    let state = typeText(setup({ mode: 'time', limit: 60 }), 'the');
    state = reduce(state, { type: 'tick', at: 3_000 });
    expect(state.status).toBe('running');
  });

  it('records one sample per second', () => {
    let state = typeText(setup({ mode: 'time', limit: 60 }), 'the');
    state = reduce(state, { type: 'tick', at: 2_000 });
    state = reduce(state, { type: 'tick', at: 2_500 }); // same second
    state = reduce(state, { type: 'tick', at: 3_000 });

    expect(state.samples).toHaveLength(2);
    expect(state.samples.map((s) => s.second)).toEqual([1, 2]);
  });

  it('ignores ticks while idle', () => {
    const state = reduce(setup({ mode: 'time', limit: 60 }), { type: 'tick', at: 5_000 });
    expect(state.samples).toHaveLength(0);
    expect(state.status).toBe('idle');
  });
});

describe('reset', () => {
  it('returns to a pristine state', () => {
    const state = reduce(typeText(setup(), 'the quick'), { type: 'reset' });

    expect(state.status).toBe('idle');
    expect(state.wordIndex).toBe(0);
    expect(state.input).toBe('');
    expect(state.startedAt).toBeNull();
    expect(state.counters.correctChars).toBe(0);
    expect(state.keystrokes).toHaveLength(0);
  });

  it('accepts a fresh word list', () => {
    const state = reduce(setup(), { type: 'reset', words: ['new', 'words'] });
    expect(state.words).toEqual(['new', 'words']);
  });
});
