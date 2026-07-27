/**
 * Game domain types.
 *
 * The one structural difference from the typing engine: no timestamps anywhere.
 * `engine.ts` is event-driven, so it takes an `at` on every action. A game is
 * simulation-driven, so time enters only as `dtMs` on a step. That is a stronger
 * determinism guarantee — a test can assert exact positions after N steps, which
 * wall-clock timestamps can never give you.
 */

import type { Locale } from '@/constants/i18n';
import type { WpmSample } from '@/features/typing/domain/types';

export type GameId = 'word-rain' | 'bomb-defusal' | 'survival';

export type GameStatus = 'idle' | 'running' | 'paused' | 'over';

/** Why a run ended. Drives the game-over copy. */
export type EndReason = 'floor' | 'error' | 'timeout' | 'quit' | null;

export interface WordEntity {
  readonly id: string;
  readonly word: string;
  /** Vertical position: 0 at the spawn line, 1 at the floor. */
  readonly y: number;
  /** Horizontal lane, 0–1. Presentation only; also breaks targeting ties. */
  readonly x: number;
  /** Units of `y` per second, fixed at spawn from the level then in force. */
  readonly speed: number;
  /** Correctly typed prefix. A word dies when this reaches its length. */
  readonly typed: string;
}

export interface GameCounters {
  readonly correctChars: number;
  readonly incorrectChars: number;
  /**
   * Always zero in games: a word vanishes the instant it is completed, so
   * typing past its end is structurally impossible. Kept in the shape so the
   * adapter to TypingCounters stays total.
   */
  readonly extraChars: number;
  readonly missedChars: number;
  readonly totalKeystrokes: number;
  readonly wordsDestroyed: number;
  readonly wordsMissed: number;
  readonly combo: number;
  readonly bestCombo: number;
}

export interface GameConfig {
  readonly gameId: GameId;
  readonly sourceId: string;
  readonly locale: Locale;
  readonly caseSensitive: boolean;
}

export interface GameState {
  readonly status: GameStatus;
  readonly config: GameConfig;
  readonly entities: readonly WordEntity[];
  /** The word being typed. Held until cleared, missed or explicitly released. */
  readonly targetId: string | null;
  readonly counters: GameCounters;
  readonly samples: readonly WpmSample[];
  /**
   * Sum of simulated steps. The only clock in the game.
   *
   * Never wall time: a backgrounded tab stops the simulation but not the wall
   * clock, and using the latter would count that dead time against the
   * player's WPM.
   */
  readonly simulatedMs: number;
  /** Last whole second sampled, so one sample is emitted per second. */
  readonly lastSampleSecond: number;
  readonly level: number;
  readonly score: number;
  /** Word Rain: how full the floor is, 0–1. Zero in other games. */
  readonly floor: number;
  /** Bomb: milliseconds left on the current fuse. Zero in other games. */
  readonly fuseMs: number;
  /** Milliseconds until the next spawn. */
  readonly spawnCooldownMs: number;
  /** Buffered words the spawner draws from; refilled by the host. */
  readonly wordQueue: readonly string[];
  /** Monotonic counter backing entity ids, so ids are deterministic. */
  readonly nextEntityId: number;
  readonly endReason: EndReason;
}

export type GameAction =
  | { readonly type: 'step'; readonly dtMs: number }
  | { readonly type: 'char'; readonly char: string }
  | { readonly type: 'backspace' }
  | { readonly type: 'refill'; readonly words: readonly string[] }
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  | { readonly type: 'end'; readonly reason: EndReason }
  | { readonly type: 'reset'; readonly words: readonly string[] };

/**
 * Per-game rules, as a strategy.
 *
 * Everything that differs between the three games lives behind this interface,
 * so adding a fourth is a data change rather than an edit to the reducer.
 */
export interface GameMode {
  readonly id: GameId;
  readonly routeKey: string;
  /** Words kept buffered ahead of the spawner. */
  readonly bufferSize: number;
  /**
   * Minimum run before XP is awarded.
   *
   * `calculateXp` already zeroes below 3s, but Survival can be ended
   * deliberately in four seconds by typing one wrong character — so each mode
   * sets its own floor rather than widening a rule that belongs to typing tests.
   */
  readonly minRunMs: number;
  /** Mode-specific fields applied on reset. */
  init(config: GameConfig): Partial<GameState>;
  /** Advances mode-specific simulation by one fixed step. */
  advance(state: GameState, dtMs: number): GameState;
  /** A word was fully typed: award score, adjust difficulty. */
  onWordCleared(state: GameState, entity: WordEntity): GameState;
  /** An incorrect keystroke landed. Survival ends the run here. */
  onError(state: GameState): GameState;
  /** Terminal check, evaluated after every step. */
  endReason(state: GameState): EndReason;
  /** The leaderboard number for this game. */
  finalScore(state: GameState): number;
}
