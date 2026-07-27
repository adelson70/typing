import { describe, expect, it } from 'vitest';

import { createInitialGameState, reduceGame, step } from '../gameEngine';
import type { GameConfig, GameState } from '../types';

const config: GameConfig = {
  gameId: 'word-rain',
  sourceId: 'english-200',
  locale: 'en',
  caseSensitive: false,
};

function start(words: readonly string[]): GameState {
  return step(createInitialGameState(config, words), 16);
}

/** Simulates until `predicate` holds, or fails the run. */
function runUntil(
  state: GameState,
  predicate: (s: GameState) => boolean,
  maxSteps = 20_000,
): GameState {
  let current = state;
  for (let i = 0; i < maxSteps; i += 1) {
    if (predicate(current)) return current;
    current = step(current, 16);
  }
  throw new Error('condition never met');
}

describe('Word Rain', () => {
  it('lets a word fall toward the floor over time', () => {
    const state = start(['alpha']);
    const before = state.entities[0]?.y ?? 0;
    const after = step(state, 1_000);

    expect(after.entities[0]?.y ?? 0).toBeGreaterThan(before);
  });

  it('charges every character of a word that reaches the floor as missed', () => {
    // Letting the screen fill has to cost accuracy, or panicking would be free.
    const state = runUntil(start(['alpha']), (s) => s.counters.wordsMissed > 0);

    expect(state.counters.missedChars).toBe('alpha'.length);
  });

  it('subtracts the typed prefix from the missed characters', () => {
    let state = start(['alpha']);
    state = reduceGame(state, { type: 'char', char: 'a' });
    state = reduceGame(state, { type: 'char', char: 'l' });

    const missed = runUntil(state, (s) => s.counters.wordsMissed > 0);

    expect(missed.counters.missedChars).toBe('alpha'.length - 2);
  });

  it('ends the run when the floor fills, not when a single word is missed', () => {
    const words = Array.from({ length: 40 }, () => 'alpha');
    const afterOne = runUntil(start(words), (s) => s.counters.wordsMissed >= 1);
    expect(afterOne.status).not.toBe('over');

    const ended = runUntil(start(words), (s) => s.status === 'over');
    expect(ended.endReason).toBe('floor');
  });

  it('releases the target when the word being typed reaches the floor', () => {
    let state = start(['alpha']);
    state = reduceGame(state, { type: 'char', char: 'a' });
    expect(state.targetId).not.toBeNull();

    const missed = runUntil(state, (s) => s.counters.wordsMissed > 0);
    expect(missed.targetId).toBeNull();
  });

  it('scores a cleared word and never awards less than the base value', () => {
    let state = start(['alpha']);
    for (const char of 'alpha') state = reduceGame(state, { type: 'char', char });

    expect(state.score).toBeGreaterThanOrEqual(10);
  });

  it('never lets fall speed decrease as the run progresses', () => {
    const words = Array.from({ length: 60 }, (_, i) => `w${i}`);
    let state = start(words);
    let previousLevel = state.level;

    for (let i = 0; i < 5_000; i += 1) {
      state = step(state, 16);
      expect(state.level).toBeGreaterThanOrEqual(previousLevel);
      previousLevel = state.level;
    }
  });
});
