/**
 * Survival.
 *
 * Endless, one life, scored by how long you lasted. A single incorrect
 * character ends the run.
 *
 * This is the mode that inverts the usual incentive: every other game rewards
 * speed and tolerates errors, so players learn to type fast and sloppily. Here
 * the only way to last is to not be wrong — which is the harder skill and the
 * one that transfers.
 */

import { reapMissed } from '../gameEngine';
import type { GameConfig, GameMode, GameState, WordEntity, EndReason } from '../types';

/** Seconds of survival per point, so the score reads as a time. */
const POINTS_PER_SECOND = 1;

export const survival: GameMode = {
  id: 'survival',
  routeKey: 'games/survival',
  bufferSize: 30,
  // Lower than the other modes: a run genuinely can end in seconds here, and
  // that is the game working rather than the player farming.
  minRunMs: 5_000,

  init(_config: GameConfig): Partial<GameState> {
    return { spawnCooldownMs: 0 };
  },

  advance(state: GameState, dtMs: number): GameState {
    const seconds = dtMs / 1000;

    const fallen: GameState = {
      ...state,
      entities: state.entities.map((entity) => ({
        ...entity,
        y: entity.y + entity.speed * seconds,
      })),
      score: Math.floor((state.simulatedMs / 1000) * POINTS_PER_SECOND),
    };

    // A word reaching the floor is charged as missed but does not end the run —
    // only a typing error does. Letting one go is a valid, costly choice.
    return reapMissed(fallen, (entity) => entity.y >= 1);
  },

  onWordCleared(state: GameState, _entity: WordEntity): GameState {
    return state;
  },

  onError(state: GameState): GameState {
    // The run is over. `endReason` reads this rather than ending here, so the
    // reducer owns every status transition.
    return state;
  },

  endReason(state: GameState): EndReason {
    return state.counters.incorrectChars > 0 ? 'error' : null;
  },

  finalScore(state: GameState): number {
    return Math.floor(state.simulatedMs);
  },
};
