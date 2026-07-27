import { describe, expect, it } from 'vitest';

import { createInitialState, reduce, type EngineState } from './engine';
import type { TestConfig } from './types';

/**
 * Combo tracking.
 *
 * The combo is the gamification layer's raw input, so it needs to mean
 * something precise: unbroken correct characters. It is deliberately NOT a
 * second accuracy figure — 95% accuracy spread evenly and 95% in one clean
 * burst are different skills, and only the combo distinguishes them.
 */

const config = (overrides: Partial<TestConfig> = {}): TestConfig => ({
  mode: 'words',
  limit: 3,
  sourceId: 'test',
  locale: 'en',
  stopOnError: false,
  ...overrides,
});

const WORDS = ['the', 'quick', 'fox'] as const;

const setup = (overrides: Partial<TestConfig> = {}) =>
  createInitialState(config(overrides), WORDS);

function typeText(state: EngineState, text: string, startAt = 1_000): EngineState {
  let next = state;
  let at = startAt;
  for (const char of text) {
    next = char === ' '
      ? reduce(next, { type: 'space', at })
      : reduce(next, { type: 'type', char, at });
    at += 50;
  }
  return next;
}

describe('combo', () => {
  it('starts at zero', () => {
    expect(setup().counters.combo).toBe(0);
    expect(setup().counters.bestCombo).toBe(0);
  });

  it('increments on each correct character', () => {
    expect(typeText(setup(), 'the').counters.combo).toBe(3);
  });

  it('resets to zero on a wrong character', () => {
    const state = typeText(setup(), 'thx');
    expect(state.counters.combo).toBe(0);
  });

  it('resets on an extra character typed past the word', () => {
    const state = typeText(setup(), 'thez');
    expect(state.counters.combo).toBe(0);
  });

  it('rebuilds after a break', () => {
    // "th" (2) then wrong (0) then two more correct characters.
    let state = typeText(setup(), 'thx');
    state = reduce(state, { type: 'backspace', at: 5_000 });
    state = typeText(state, 'e', 5_100);
    expect(state.counters.combo).toBe(1);
  });

  it('carries through the space when a word is typed perfectly', () => {
    // "the" is 3 characters, plus the space itself.
    const state = typeText(setup(), 'the ');
    expect(state.counters.combo).toBe(4);
  });

  it('ends at the space when the word had an error', () => {
    const state = typeText(setup(), 'thx ');
    expect(state.counters.combo).toBe(0);
  });

  it('survives across words when typing cleanly', () => {
    const state = typeText(setup(), 'the quick');
    // 3 + space + 5 = 9
    expect(state.counters.combo).toBe(9);
  });

  it('breaks when stopOnError refuses a keystroke', () => {
    // The character never lands, but the attempt was still a mistake.
    const state = typeText(setup({ stopOnError: true }), 'thx');
    expect(state.counters.combo).toBe(0);
  });
});

describe('bestCombo', () => {
  it('records the peak, not the current value', () => {
    // Build 4 ("the " with space), break it, then type 1.
    let state = typeText(setup(), 'the ');
    expect(state.counters.combo).toBe(4);

    state = typeText(state, 'x', 9_000);
    expect(state.counters.combo).toBe(0);
    expect(state.counters.bestCombo).toBe(4);
  });

  it('never decreases', () => {
    let state = typeText(setup(), 'the quick');
    const peak = state.counters.bestCombo;

    state = typeText(state, 'zzz', 20_000);
    expect(state.counters.bestCombo).toBeGreaterThanOrEqual(peak);
  });

  it('is preserved when the perfect-word bonus sets a new peak', () => {
    const state = typeText(setup(), 'the ');
    expect(state.counters.bestCombo).toBe(4);
  });

  it('resets with the test', () => {
    const state = reduce(typeText(setup(), 'the quick'), { type: 'reset' });
    expect(state.counters.bestCombo).toBe(0);
    expect(state.counters.combo).toBe(0);
  });
});
