import { describe, expect, it } from 'vitest';

import { createInitialGameState, reduceGame, step } from './gameEngine';
import type { GameConfig, GameId, GameState } from './types';

function config(gameId: GameId = 'word-rain'): GameConfig {
  return { gameId, sourceId: 'english-200', locale: 'en', caseSensitive: false };
}

function start(words: readonly string[], gameId: GameId = 'word-rain'): GameState {
  // One step spawns the first word and starts the simulation.
  return step(createInitialGameState(config(gameId), words), 16);
}

function typeWord(state: GameState, word: string): GameState {
  return [...word].reduce((s, char) => reduceGame(s, { type: 'char', char }), state);
}

describe('createInitialGameState', () => {
  it('starts idle so the clock only runs once the player acts', () => {
    const state = createInitialGameState(config(), ['alpha']);

    expect(state.status).toBe('idle');
    expect(state.simulatedMs).toBe(0);
  });
});

describe('reduceGame — time', () => {
  it('advances the simulation by exactly the steps it is given, never by wall clock', () => {
    let state = start(['alpha', 'bravo']);
    const before = state.simulatedMs;

    for (let i = 0; i < 10; i += 1) state = step(state, 16);

    expect(state.simulatedMs).toBe(before + 160);
  });

  it('produces identical state for the same word list and the same step sequence', () => {
    const run = (): GameState => {
      let state = start(['alpha', 'bravo', 'charlie']);
      for (let i = 0; i < 50; i += 1) state = step(state, 16);
      return state;
    };

    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });

  it('emits one WPM sample per simulated second and ignores repeat steps within it', () => {
    let state = start(['alpha']);
    state = typeWord(state, 'alpha');

    // 1.6 seconds of simulation in 100 steps.
    for (let i = 0; i < 100; i += 1) state = step(state, 16);

    const seconds = state.samples.map((sample) => sample.second);
    expect(seconds).toEqual([...new Set(seconds)]);
    expect(state.samples.length).toBeLessThanOrEqual(2);
  });

  it('does not advance the simulation while paused', () => {
    let state = start(['alpha']);
    state = typeWord(state, 'al');
    state = reduceGame(state, { type: 'pause' });

    const paused = state.simulatedMs;
    state = step(state, 500);

    expect(state.simulatedMs).toBe(paused);
  });

  it('resumes from exactly where it paused', () => {
    let state = start(['alpha']);
    state = reduceGame(state, { type: 'pause' });
    state = reduceGame(state, { type: 'resume' });
    const before = state.simulatedMs;
    state = step(state, 100);

    expect(state.simulatedMs).toBe(before + 100);
  });
});

describe('reduceGame — typing', () => {
  it('starts the run on the first keystroke', () => {
    const idle = createInitialGameState(config(), ['alpha']);
    const spawned = step(idle, 16);

    expect(reduceGame(spawned, { type: 'char', char: 'a' }).status).toBe('running');
  });

  it('destroys a word once its final character is typed', () => {
    let state = start(['alpha', 'bravo']);
    expect(state.entities).toHaveLength(1);

    state = typeWord(state, 'alpha');

    expect(state.entities).toHaveLength(0);
    expect(state.counters.wordsDestroyed).toBe(1);
  });

  it('counts an unmatched keystroke as an error rather than ignoring it', () => {
    let state = start(['alpha']);
    state = reduceGame(state, { type: 'char', char: 'z' });

    expect(state.counters.incorrectChars).toBe(1);
    expect(state.counters.totalKeystrokes).toBe(1);
  });

  it('breaks the combo on an error and rebuilds it from zero', () => {
    let state = start(['alpha']);
    state = typeWord(state, 'alp');
    expect(state.counters.combo).toBe(3);

    state = reduceGame(state, { type: 'char', char: 'z' });
    expect(state.counters.combo).toBe(0);
    expect(state.counters.bestCombo).toBe(3);
  });

  it('keeps the original error after a backspace correction', () => {
    // The same rule the typing engine states: backspace restores the display,
    // not the score, or accuracy would measure diligence in correcting rather
    // than skill in typing.
    let state = start(['alpha']);
    state = typeWord(state, 'al');
    state = reduceGame(state, { type: 'char', char: 'z' });
    state = reduceGame(state, { type: 'backspace' });

    expect(state.counters.incorrectChars).toBe(1);
  });

  it('ignores keystrokes once the run is over', () => {
    let state = start(['alpha'], 'survival');
    state = reduceGame(state, { type: 'char', char: 'z' });
    expect(state.status).toBe('over');

    const after = reduceGame(state, { type: 'char', char: 'a' });
    expect(after.counters.totalKeystrokes).toBe(state.counters.totalKeystrokes);
  });
});

describe('reduceGame — spawning', () => {
  it('never exceeds the concurrent word cap, so the stage stays cheap to render', () => {
    const words = Array.from({ length: 200 }, (_, i) => `word${i}`);
    let state = start(words);

    // Ten minutes of simulation without typing a single word.
    for (let i = 0; i < 37_500; i += 1) state = step(state, 16);

    expect(state.entities.length).toBeLessThanOrEqual(18);
  });

  it('takes words from the queue in order', () => {
    let state = start(['alpha', 'bravo']);
    expect(state.entities[0]?.word).toBe('alpha');

    // Advance past the spawn cooldown.
    for (let i = 0; i < 200; i += 1) state = step(state, 16);

    expect(state.entities.map((e) => e.word)).toContain('bravo');
  });

  it('accepts a refill without disturbing words already in flight', () => {
    let state = start(['alpha']);
    const before = state.entities.map((e) => e.id);

    state = reduceGame(state, { type: 'refill', words: ['bravo'] });

    expect(state.entities.map((e) => e.id)).toEqual(before);
    expect(state.wordQueue).toContain('bravo');
  });
});
