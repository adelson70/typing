/**
 * Bomb Defusal.
 *
 * One word at a time on a visible fuse. Type it in time and it is defused; let
 * the fuse run out and it explodes. The fuse shortens as you succeed, so the
 * pressure comes from the clock rather than from the screen filling up.
 *
 * Three lives, because a single-mistake game on a timer is a game most players
 * lose in ten seconds and never open again.
 */

import { reapMissed } from '../gameEngine';
import { fuseMs } from '../difficulty';
import type { GameConfig, GameMode, GameState, WordEntity, EndReason } from '../types';

export const MAX_LIVES = 3;

/** Lives remaining, derived from misses so no extra state is needed. */
export function livesLeft(state: GameState): number {
  return Math.max(0, MAX_LIVES - state.counters.wordsMissed);
}

const BASE_POINTS = 15;

export const bombDefusal: GameMode = {
  id: 'bomb-defusal',
  routeKey: 'games/bomb-defusal',
  bufferSize: 20,
  minRunMs: 10_000,

  init(_config: GameConfig): Partial<GameState> {
    return { spawnCooldownMs: 0, fuseMs: 0 };
  },

  advance(state: GameState, dtMs: number): GameState {
    const active = state.entities[0];

    // No bomb on screen: the spawner will place one next step.
    if (!active) return state.fuseMs === 0 ? state : { ...state, fuseMs: 0 };

    // A bomb with no fuse was just spawned. Arm it and let it tick next step,
    // so a word never loses time to the frame it appeared on.
    if (state.fuseMs <= 0) {
      return { ...state, fuseMs: fuseMs(state.level, active.word.length) };
    }

    const remaining = state.fuseMs - dtMs;
    if (remaining > 0) return { ...state, fuseMs: remaining };

    // The fuse ran out: the bomb explodes and its untyped remainder is charged
    // as missed, exactly as a fallen word would be.
    return { ...reapMissed(state, (entity) => entity.id === active.id), fuseMs: 0 };
  },

  onWordCleared(state: GameState, entity: WordEntity): GameState {
    // Defusing with time to spare is the skilled play, so the remaining fuse is
    // the bonus.
    const speedBonus = Math.round(state.fuseMs / 200);
    const lengthBonus = Math.max(0, entity.word.length - 3) * 3;

    return {
      ...state,
      score: state.score + BASE_POINTS + lengthBonus + speedBonus,
      // Cleared: disarm, so the next spawn arms a fresh fuse.
      fuseMs: 0,
    };
  },

  onError(state: GameState): GameState {
    // A mistype burns a second of fuse. Harsher than Word Rain because there is
    // only ever one target — without a cost, guessing letters would be free.
    return { ...state, fuseMs: Math.max(0, state.fuseMs - 1_000) };
  },

  endReason(state: GameState): EndReason {
    return livesLeft(state) <= 0 ? 'timeout' : null;
  },

  finalScore(state: GameState): number {
    return state.score;
  },
};
