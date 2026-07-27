/**
 * The game engine: a pure state machine over keystrokes and simulated time.
 *
 * Same discipline as the typing engine — no React, no timers, no DOM — with one
 * deliberate difference: no timestamps. Time enters only as `dtMs` on a step, so
 * a test can assert exact positions after N steps. Wall-clock timestamps could
 * never give that.
 *
 * Mode-specific rules live behind `GameMode` rather than in this switch, so the
 * reducer stays the same size whether there are three games or ten.
 */

import { EMPTY_GAME_COUNTERS, missedCharsFor } from './counters';
import { MAX_CONCURRENT_WORDS, fallSpeed, levelForCleared, spawnIntervalMs } from './difficulty';
import { getGameMode } from './registry';
import { resolveTarget, type TargetCandidate } from './targeting';
import type { GameAction, GameConfig, GameState, WordEntity } from './types';

function assertNever(value: never): never {
  throw new Error(`Unhandled game action: ${JSON.stringify(value)}`);
}

export function createInitialGameState(
  config: GameConfig,
  words: readonly string[],
): GameState {
  const mode = getGameMode(config.gameId);

  const base: GameState = {
    status: 'idle',
    config,
    entities: [],
    targetId: null,
    counters: EMPTY_GAME_COUNTERS,
    samples: [],
    simulatedMs: 0,
    lastSampleSecond: -1,
    level: 1,
    score: 0,
    floor: 0,
    fuseMs: 0,
    spawnCooldownMs: 0,
    wordQueue: words,
    nextEntityId: 0,
    endReason: null,
  };

  return { ...base, ...mode.init(config) };
}

/** Words currently on screen, projected for the targeting rule. */
function toCandidates(state: GameState): readonly TargetCandidate[] {
  return state.entities.map((entity) => ({
    id: entity.id,
    word: entity.word,
    y: entity.y,
    x: entity.x,
    typed: entity.typed,
  }));
}

/**
 * Emits at most one WPM sample per simulated second.
 *
 * A direct copy of the typing engine's sampling, driven by `simulatedMs` rather
 * than a timestamp — which is what keeps consistency comparable between a game
 * and a test while staying deterministic in a unit test.
 */
function sample(state: GameState): GameState {
  const second = Math.floor(state.simulatedMs / 1000);
  if (second <= state.lastSampleSecond) return state;

  const { correctChars, incorrectChars, extraChars } = state.counters;
  const typedChars = correctChars + incorrectChars + extraChars;
  const minutes = state.simulatedMs / 60_000;

  return {
    ...state,
    lastSampleSecond: second,
    samples: [
      ...state.samples,
      {
        second,
        wpm: minutes > 0 ? correctChars / 5 / minutes : 0,
        rawWpm: minutes > 0 ? typedChars / 5 / minutes : 0,
        errors: incorrectChars,
      },
    ],
  };
}

/** Pulls the next word off the queue, if the stage has room for it. */
function spawn(state: GameState): GameState {
  if (state.entities.length >= MAX_CONCURRENT_WORDS) return state;

  const word = state.wordQueue[0];
  if (word === undefined) return state;

  // Lanes are derived from the entity counter rather than randomly, so a run is
  // reproducible from its word list alone.
  const lane = ((state.nextEntityId * 0.382) % 1 + 1) % 1;

  const entity: WordEntity = {
    id: `e${state.nextEntityId}`,
    word,
    y: 0,
    x: lane,
    // Speed is fixed at birth from the level then in force, so a level-up never
    // accelerates a word already in flight — the player's read of the board
    // stays valid.
    speed: fallSpeed(state.level),
    typed: '',
  };

  return {
    ...state,
    entities: [...state.entities, entity],
    wordQueue: state.wordQueue.slice(1),
    nextEntityId: state.nextEntityId + 1,
    spawnCooldownMs: spawnIntervalMs(state.level),
  };
}

/** Applies an accepted keystroke to the targeted word. */
function advanceTarget(state: GameState, targetId: string, char: string): GameState {
  const mode = getGameMode(state.config.gameId);
  const entity = state.entities.find((e) => e.id === targetId);
  if (!entity) return state;

  const typed = entity.typed + char;
  const combo = state.counters.combo + 1;

  const withChar: GameState = {
    ...state,
    targetId,
    counters: {
      ...state.counters,
      correctChars: state.counters.correctChars + 1,
      totalKeystrokes: state.counters.totalKeystrokes + 1,
      combo,
      bestCombo: Math.max(state.counters.bestCombo, combo),
    },
    entities: state.entities.map((e) => (e.id === targetId ? { ...e, typed } : e)),
  };

  if (typed.length < entity.word.length) return withChar;

  // The word is complete: it leaves the stage and the lock is released.
  const cleared: GameState = {
    ...withChar,
    entities: withChar.entities.filter((e) => e.id !== targetId),
    targetId: null,
    counters: {
      ...withChar.counters,
      wordsDestroyed: withChar.counters.wordsDestroyed + 1,
    },
  };

  const scored = mode.onWordCleared(cleared, { ...entity, typed });
  return { ...scored, level: levelForCleared(scored.counters.wordsDestroyed) };
}

function applyError(state: GameState, targetId: string | null): GameState {
  const mode = getGameMode(state.config.gameId);

  const withError: GameState = {
    ...state,
    targetId,
    counters: {
      ...state.counters,
      incorrectChars: state.counters.incorrectChars + 1,
      totalKeystrokes: state.counters.totalKeystrokes + 1,
      combo: 0,
    },
  };

  return mode.onError(withError);
}

/** Removes words that reached the floor, charging their untyped remainder. */
export function reapMissed(
  state: GameState,
  shouldReap: (entity: WordEntity) => boolean,
): GameState {
  const missed = state.entities.filter(shouldReap);
  if (missed.length === 0) return state;

  const missedChars = missed.reduce(
    (total, entity) => total + missedCharsFor(entity.word, entity.typed),
    0,
  );

  const missedIds = new Set(missed.map((entity) => entity.id));

  return {
    ...state,
    entities: state.entities.filter((entity) => !missedIds.has(entity.id)),
    // A missed word releases the lock, so the next keystroke can acquire freely.
    targetId: state.targetId !== null && missedIds.has(state.targetId) ? null : state.targetId,
    counters: {
      ...state.counters,
      missedChars: state.counters.missedChars + missedChars,
      wordsMissed: state.counters.wordsMissed + missed.length,
      combo: 0,
    },
  };
}

export function reduceGame(state: GameState, action: GameAction): GameState {
  const mode = getGameMode(state.config.gameId);

  switch (action.type) {
    case 'reset':
      return createInitialGameState(state.config, action.words);

    case 'refill':
      return { ...state, wordQueue: [...state.wordQueue, ...action.words] };

    case 'pause':
      return state.status === 'running' ? { ...state, status: 'paused' } : state;

    case 'resume':
      return state.status === 'paused' ? { ...state, status: 'running' } : state;

    case 'end':
      if (state.status === 'over') return state;
      return {
        ...state,
        status: 'over',
        endReason: action.reason,
        score: mode.finalScore(state),
      };

    case 'backspace': {
      if (state.status === 'over' || state.targetId === null) return state;

      // Restores the display only. The original error still counts against
      // accuracy — the same rule the typing engine states, kept identical so a
      // game score and a test score mean the same thing.
      return {
        ...state,
        entities: state.entities.map((entity) =>
          entity.id === state.targetId
            ? { ...entity, typed: entity.typed.slice(0, -1) }
            : entity,
        ),
      };
    }

    case 'char': {
      if (state.status === 'over' || state.status === 'paused') return state;

      const running: GameState = state.status === 'idle' ? { ...state, status: 'running' } : state;

      // A keystroke with nothing on screen is not the player's error — the
      // stage simply has not spawned yet.
      if (running.entities.length === 0) return running;

      const { targetId, accepted } = resolveTarget(
        toCandidates(running),
        running.targetId,
        action.char,
        running.config.caseSensitive,
      );

      const next =
        accepted && targetId !== null
          ? advanceTarget(running, targetId, action.char)
          : applyError(running, targetId);

      const reason = mode.endReason(next);
      return reason === null
        ? next
        : reduceGame(next, { type: 'end', reason });
    }

    case 'step': {
      if (state.status === 'over' || state.status === 'paused') return state;

      // A game runs from the moment it is mounted, unlike a typing test that
      // waits for the first keystroke: words have to be falling before there is
      // anything to type. Idle promotes to running on the first step.
      const running: GameState = state.status === 'idle' ? { ...state, status: 'running' } : state;

      const advanced = mode.advance(
        { ...running, simulatedMs: running.simulatedMs + action.dtMs },
        action.dtMs,
      );

      const cooled: GameState = {
        ...advanced,
        spawnCooldownMs: Math.max(0, advanced.spawnCooldownMs - action.dtMs),
      };

      const spawned = cooled.spawnCooldownMs === 0 ? spawn(cooled) : cooled;
      const sampled = sample(spawned);

      const reason = mode.endReason(sampled);
      return reason === null
        ? sampled
        : reduceGame(sampled, { type: 'end', reason });
    }

    default:
      return assertNever(action);
  }
}

/** Convenience wrapper for tests and the loop. */
export function step(state: GameState, dtMs: number): GameState {
  return reduceGame(state, { type: 'step', dtMs });
}
