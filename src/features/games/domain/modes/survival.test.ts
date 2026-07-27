import { describe, expect, it } from 'vitest';

import { createInitialGameState, reduceGame, step } from '../gameEngine';
import type { GameConfig, GameState } from '../types';

const config: GameConfig = {
  gameId: 'survival',
  sourceId: 'english-200',
  locale: 'en',
  caseSensitive: false,
};

function start(words: readonly string[]): GameState {
  return step(createInitialGameState(config, words), 16);
}

describe('Survival', () => {
  it('ends the run on the first incorrect character', () => {
    const state = reduceGame(start(['alpha']), { type: 'char', char: 'z' });

    expect(state.status).toBe('over');
    expect(state.endReason).toBe('error');
  });

  it('survives a missed word, because only a typing error ends the run', () => {
    // Letting one go is a valid, costly choice — the mode punishes being wrong,
    // not being slow.
    let state = start(['alpha']);
    for (let i = 0; i < 5_000 && state.counters.wordsMissed === 0; i += 1) {
      state = step(state, 16);
    }

    expect(state.counters.wordsMissed).toBeGreaterThan(0);
    expect(state.status).not.toBe('over');
  });

  it('scores the run by time survived, not by words typed', () => {
    let state = start(['alpha', 'bravo']);
    for (let i = 0; i < 200; i += 1) state = step(state, 16);

    const beforeTyping = state.score;
    for (const char of 'alpha') state = reduceGame(state, { type: 'char', char });

    // Clearing a word earns no points; only the clock does.
    expect(state.score).toBe(beforeTyping);

    state = step(state, 5_000);
    expect(state.score).toBeGreaterThan(beforeTyping);
  });

  it('reports the final score in milliseconds survived', () => {
    let state = start(['alpha']);
    for (let i = 0; i < 100; i += 1) state = step(state, 16);
    const survived = state.simulatedMs;

    state = reduceGame(state, { type: 'char', char: 'z' });

    expect(state.score).toBe(Math.floor(survived));
  });

  it('accepts correct typing indefinitely', () => {
    let state = start(['alpha', 'bravo']);
    for (const char of 'alpha') state = reduceGame(state, { type: 'char', char });

    expect(state.status).toBe('running');
    expect(state.counters.wordsDestroyed).toBe(1);
  });
});
