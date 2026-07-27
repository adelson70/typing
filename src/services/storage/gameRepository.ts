/**
 * Game records and high scores.
 *
 * Deliberately separate from the results store: a game run must never reach
 * test history, where it would skew average WPM and the statistics page. A
 * player who spends an evening on Word Rain should not find their "average
 * speed" rewritten by it.
 *
 * LocalStorage rather than a new IndexedDB store — bumping `DB_VERSION` forces
 * an upgrade on every existing user, and a second open tab can block it, which
 * would cost access to *all* history for the sake of three high scores.
 *
 * This module must never import `resultsRepository`. A test enforces it.
 */

import { GAMES_SCHEMA_VERSION, GAMES_STORAGE_KEY } from '@/constants/storage';
import type { Locale } from '@/constants/i18n';
import type { GameId } from '@/features/games/domain/types';
import { readJson, writeJson } from './localStorage';

/** One completed run. Note it is NOT a `TestResult` — that is the whole point. */
export interface GameRecord {
  readonly id: string;
  readonly gameId: GameId;
  readonly completedAt: number;
  /** Game-native: points for Word Rain and Bomb, milliseconds for Survival. */
  readonly score: number;
  readonly level: number;
  readonly wordsDestroyed: number;
  readonly wordsMissed: number;
  readonly bestCombo: number;
  readonly durationMs: number;
  readonly wpm: number;
  readonly accuracy: number;
  readonly xpAwarded: number;
  readonly locale: Locale;
  readonly sourceId: string;
}

export interface GameStats {
  readonly bestScore: number;
  readonly runs: number;
  readonly totalWordsDestroyed: number;
  readonly bestCombo: number;
  readonly totalTimeMs: number;
  readonly longestSurvivalMs: number;
  readonly bestWpm: number;
}

export interface GamesState {
  readonly version: number;
  /** Keyed by `GameId`. */
  readonly best: Readonly<Record<string, GameStats>>;
  /** Newest last, capped per game. */
  readonly records: readonly GameRecord[];
  /** `YYYY-MM-DD` UTC days on which a game was played, for the streak. */
  readonly playedDays: readonly string[];
}

export const EMPTY_GAME_STATS: GameStats = {
  bestScore: 0,
  runs: 0,
  totalWordsDestroyed: 0,
  bestCombo: 0,
  totalTimeMs: 0,
  longestSurvivalMs: 0,
  bestWpm: 0,
};

export const EMPTY_GAMES: GamesState = {
  version: GAMES_SCHEMA_VERSION,
  best: {},
  records: [],
  playedDays: [],
};

/**
 * Records kept per game.
 *
 * Bounded so a long-playing user cannot grow the blob toward the ~5MB
 * LocalStorage ceiling, which would start failing *other* writes too.
 */
export const MAX_RECORDS_PER_GAME = 50;

const DAY_MS = 86_400_000;

function toDayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function isGameRecord(value: unknown): value is GameRecord {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;

  return (
    typeof r['id'] === 'string' &&
    typeof r['gameId'] === 'string' &&
    typeof r['completedAt'] === 'number' &&
    typeof r['score'] === 'number' &&
    Number.isFinite(r['score']) &&
    typeof r['durationMs'] === 'number' &&
    typeof r['wpm'] === 'number' &&
    typeof r['accuracy'] === 'number'
  );
}

function isGameStats(value: unknown): value is GameStats {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;

  return typeof s['bestScore'] === 'number' && typeof s['runs'] === 'number';
}

/**
 * Structural validation of the persisted payload.
 *
 * A version mismatch discards rather than migrates. Losing a high score is
 * annoying; losing typing history would not be acceptable — which is exactly
 * why the two live in different stores.
 */
function isGamesState(value: unknown): value is GamesState {
  if (typeof value !== 'object' || value === null) return false;
  const g = value as Record<string, unknown>;

  return (
    g['version'] === GAMES_SCHEMA_VERSION &&
    typeof g['best'] === 'object' &&
    g['best'] !== null &&
    Object.values(g['best'] as Record<string, unknown>).every(isGameStats) &&
    Array.isArray(g['records']) &&
    g['records'].every(isGameRecord) &&
    Array.isArray(g['playedDays']) &&
    g['playedDays'].every((day) => typeof day === 'string')
  );
}

export function loadGames(): GamesState {
  return readJson(GAMES_STORAGE_KEY, isGamesState) ?? EMPTY_GAMES;
}

export function saveGames(state: GamesState): boolean {
  return writeJson(GAMES_STORAGE_KEY, state);
}

export function getGameStats(state: GamesState, gameId: GameId): GameStats {
  return state.best[gameId] ?? EMPTY_GAME_STATS;
}

/**
 * Folds a finished run into stored state.
 *
 * Pure, and monotonic on every `best` field: a replayed or double-submitted run
 * can never lower a record, and never inflate one either.
 */
export function applyGameRun(current: GamesState, record: GameRecord): GamesState {
  const previous = getGameStats(current, record.gameId);

  const stats: GameStats = {
    bestScore: Math.max(previous.bestScore, record.score),
    runs: previous.runs + 1,
    totalWordsDestroyed: previous.totalWordsDestroyed + Math.max(0, record.wordsDestroyed),
    bestCombo: Math.max(previous.bestCombo, record.bestCombo),
    totalTimeMs: previous.totalTimeMs + Math.max(0, record.durationMs),
    longestSurvivalMs: Math.max(previous.longestSurvivalMs, record.durationMs),
    bestWpm: Math.max(previous.bestWpm, record.wpm),
  };

  // Trim this game's records to the cap, leaving other games' untouched.
  const sameGame = current.records.filter((r) => r.gameId === record.gameId);
  const otherGames = current.records.filter((r) => r.gameId !== record.gameId);
  const kept = [...sameGame, record].slice(-MAX_RECORDS_PER_GAME);

  const day = toDayKey(record.completedAt);

  return {
    version: GAMES_SCHEMA_VERSION,
    best: { ...current.best, [record.gameId]: stats },
    records: [...otherGames, ...kept],
    playedDays: current.playedDays.includes(day)
      ? current.playedDays
      : [...current.playedDays, day],
  };
}

/**
 * Consecutive days ending today (or yesterday) on which a game was played.
 *
 * Mirrors `calculateStreak` for test history, including the yesterday anchor:
 * a streak is not reported broken merely because the player has not opened the
 * site yet today.
 */
export function gameStreak(state: GamesState, now: number = Date.now()): number {
  const days = new Set(state.playedDays);
  if (days.size === 0) return 0;

  const today = toDayKey(now);
  const yesterday = toDayKey(now - DAY_MS);

  let cursor: number;
  if (days.has(today)) {
    cursor = now;
  } else if (days.has(yesterday)) {
    cursor = now - DAY_MS;
  } else {
    return 0;
  }

  let streak = 0;
  while (days.has(toDayKey(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }

  return streak;
}

/** Every day the player was active, whether by test or by game. */
export function mergeActiveDays(
  gameDays: readonly string[],
  testDays: readonly string[],
): readonly string[] {
  return [...new Set([...gameDays, ...testDays])];
}

/**
 * Streak across both activities.
 *
 * Games count toward the daily streak without writing to test history, so
 * playing keeps the habit alive while leaving WPM statistics untouched.
 */
export function combinedStreak(
  gameDays: readonly string[],
  testDays: readonly string[],
  now: number = Date.now(),
): number {
  return gameStreak(
    { ...EMPTY_GAMES, playedDays: mergeActiveDays(gameDays, testDays) },
    now,
  );
}

export function resetGames(): boolean {
  return saveGames(EMPTY_GAMES);
}
