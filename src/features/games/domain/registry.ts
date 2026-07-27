/**
 * The game catalogue.
 *
 * One lookup table maps an id to its rules, so the reducer never branches on
 * which game is running and adding a fourth is a data change.
 */

import { bombDefusal } from './modes/bombDefusal';
import { survival } from './modes/survival';
import { wordRain } from './modes/wordRain';
import type { GameId, GameMode } from './types';

export const GAME_MODES: readonly GameMode[] = [wordRain, bombDefusal, survival];

export const GAME_IDS: readonly GameId[] = GAME_MODES.map((mode) => mode.id);

/** Route keys, consumed by `routes.ts` so the allow-list cannot drift. */
export const GAME_ROUTE_KEYS: readonly string[] = GAME_MODES.map((mode) => mode.routeKey);

const BY_ID = new Map(GAME_MODES.map((mode) => [mode.id, mode]));

export function isGameId(value: string): value is GameId {
  return BY_ID.has(value as GameId);
}

/**
 * Rules for a game.
 *
 * Throws rather than returning undefined: the reducer calls this on every
 * action, and a silent fallback would turn a bad id into a game that quietly
 * behaves like a different one.
 */
export function getGameMode(id: GameId): GameMode {
  const mode = BY_ID.get(id);
  if (!mode) throw new Error(`Unknown game: ${id}`);
  return mode;
}
