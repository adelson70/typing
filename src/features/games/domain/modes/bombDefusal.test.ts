import { describe, expect, it } from 'vitest';

import { createInitialGameState, reduceGame, step } from '../gameEngine';
import { MAX_LIVES, livesLeft } from './bombDefusal';
import type { GameConfig, GameState } from '../types';

const config: GameConfig = {
  gameId: 'bomb-defusal',
  sourceId: 'english-200',
  locale: 'en',
  caseSensitive: false,
};

function start(words: readonly string[]): GameState {
  // Two steps: one spawns the bomb, the next arms its fuse.
  return step(step(createInitialGameState(config, words), 16), 16);
}

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

describe('Bomb Defusal', () => {
  it('arms a fuse for the bomb on screen', () => {
    expect(start(['alpha']).fuseMs).toBeGreaterThan(0);
  });

  it('burns the fuse down as time passes', () => {
    const state = start(['alpha']);
    const before = state.fuseMs;

    expect(step(state, 500).fuseMs).toBeLessThan(before);
  });

  it('counts the untyped remainder of an exploded word as missed', () => {
    let state = start(['alpha']);
    state = reduceGame(state, { type: 'char', char: 'a' });

    const exploded = runUntil(state, (s) => s.counters.wordsMissed > 0);

    expect(exploded.counters.missedChars).toBe('alpha'.length - 1);
  });

  it('grants three lives, so one bad word does not end the run', () => {
    const words = Array.from({ length: 10 }, () => 'alpha');
    const afterOne = runUntil(start(words), (s) => s.counters.wordsMissed === 1);

    expect(afterOne.status).not.toBe('over');
    expect(livesLeft(afterOne)).toBe(MAX_LIVES - 1);
  });

  it('ends the run once every life is spent', () => {
    const words = Array.from({ length: 10 }, () => 'alpha');
    const ended = runUntil(start(words), (s) => s.status === 'over');

    expect(ended.endReason).toBe('timeout');
    expect(livesLeft(ended)).toBe(0);
  });

  it('costs fuse time for a mistype, so guessing letters is never free', () => {
    const state = start(['alpha']);
    const before = state.fuseMs;
    const after = reduceGame(state, { type: 'char', char: 'z' });

    expect(after.fuseMs).toBeLessThan(before);
  });

  it('disarms after a defusal so the next bomb gets a fresh fuse', () => {
    let state = start(['alpha', 'bravo']);
    for (const char of 'alpha') state = reduceGame(state, { type: 'char', char });

    expect(state.counters.wordsDestroyed).toBe(1);
    expect(state.fuseMs).toBe(0);
  });

  it('rewards defusing with time to spare', () => {
    const quick = (() => {
      let state = start(['alpha']);
      for (const char of 'alpha') state = reduceGame(state, { type: 'char', char });
      return state.score;
    })();

    const slow = (() => {
      let state = start(['alpha']);
      state = step(state, 2_000);
      for (const char of 'alpha') state = reduceGame(state, { type: 'char', char });
      return state.score;
    })();

    expect(quick).toBeGreaterThan(slow);
  });
});
