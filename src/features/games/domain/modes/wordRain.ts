/**
 * Word Rain.
 *
 * Words fall; typing one destroys it; the ones you miss pile up on the floor.
 * The run ends when the floor fills — not on a single miss, so a bad moment is
 * recoverable and the pressure builds rather than snapping.
 */

import { reapMissed } from '../gameEngine';
import { spawnIntervalMs } from '../difficulty';
import type { GameConfig, GameMode, GameState, WordEntity, EndReason } from '../types';

/** How much of the floor one missed word occupies. Eight misses ends a run. */
const FLOOR_PER_MISS = 0.125;

/** Points per cleared word, before the length bonus. */
const BASE_POINTS = 10;

export const wordRain: GameMode = {
  id: 'word-rain',
  routeKey: 'games/word-rain',
  bufferSize: 40,
  minRunMs: 10_000,

  init(_config: GameConfig): Partial<GameState> {
    // Spawn immediately rather than after a cooldown, so the stage is never
    // empty on the first frame.
    return { spawnCooldownMs: 0, floor: 0 };
  },

  advance(state: GameState, dtMs: number): GameState {
    const seconds = dtMs / 1000;

    const fallen: GameState = {
      ...state,
      entities: state.entities.map((entity) => ({
        ...entity,
        y: entity.y + entity.speed * seconds,
      })),
    };

    const landed = fallen.entities.filter((entity) => entity.y >= 1);
    if (landed.length === 0) return fallen;

    const reaped = reapMissed(fallen, (entity) => entity.y >= 1);

    return {
      ...reaped,
      floor: Math.min(1, reaped.floor + landed.length * FLOOR_PER_MISS),
    };
  },

  onWordCleared(state: GameState, entity: WordEntity): GameState {
    // Longer words are worth more, and clearing one low is worth more than
    // clearing one that just spawned — both reward the harder play.
    const lengthBonus = Math.max(0, entity.word.length - 3) * 2;
    const urgency = Math.round(entity.y * 10);

    return { ...state, score: state.score + BASE_POINTS + lengthBonus + urgency };
  },

  onError(state: GameState): GameState {
    // A mistype costs the combo (already handled by the reducer) but nothing
    // else — the punishment for errors here is the time they waste while the
    // screen keeps filling.
    return state;
  },

  endReason(state: GameState): EndReason {
    return state.floor >= 1 ? 'floor' : null;
  },

  finalScore(state: GameState): number {
    return state.score;
  },
};

/** Exported for the HUD, which shows the next spawn as a pacing cue. */
export function nextSpawnMs(level: number): number {
  return spawnIntervalMs(level);
}
