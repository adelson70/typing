/**
 * Difficulty ramps, shared by all three games.
 *
 * Centralised so the games share a *feel*: a player who learns the pace of one
 * is not surprised by another. Every curve here is monotonic and bounded —
 * difficulty must always rise, but never past the point where the game stops
 * being winnable, which is what turns a challenge into a wall.
 */

/** Words cleared before the first level-up, then growing per level. */
const CLEARED_PER_LEVEL = 8;

/** Level from words cleared. Logarithmic, so the ramp eases as it climbs. */
export function levelForCleared(cleared: number): number {
  if (cleared <= 0) return 1;
  return Math.floor(Math.log2(cleared / CLEARED_PER_LEVEL + 1)) + 1;
}

const BASE_FALL_SPEED = 0.055;
const MAX_FALL_SPEED = 0.32;

/**
 * Fall speed in y-units per second (1.0 = spawn line to floor).
 *
 * Approaches the cap asymptotically rather than reaching it: an unbounded ramp
 * eventually makes the game a coin flip on reaction time rather than typing.
 */
export function fallSpeed(level: number): number {
  const l = Math.max(1, level);
  const growth = 1 - 1 / (1 + (l - 1) * 0.22);
  return BASE_FALL_SPEED + (MAX_FALL_SPEED - BASE_FALL_SPEED) * growth;
}

const BASE_SPAWN_MS = 2_000;
const MIN_SPAWN_MS = 420;

/** Milliseconds between spawns. Monotonically decreasing, floored. */
export function spawnIntervalMs(level: number): number {
  const l = Math.max(1, level);
  const interval = BASE_SPAWN_MS * Math.pow(0.87, l - 1);
  return Math.max(MIN_SPAWN_MS, Math.round(interval));
}

/** Hard cap on words on screen at once, so the DOM stage stays cheap. */
export const MAX_CONCURRENT_WORDS = 18;

const MIN_FUSE_MS = 2_500;

/**
 * Fixed reading time, before any typing happens.
 *
 * Without it, a short word gets a fuse measured only in typing time, leaving
 * nothing for the player to notice the word, find the first key and commit —
 * which is most of the clock on the first bomb of a run.
 */
const REACTION_MS = 1_800;

/** Milliseconds granted per character, before the level penalty. */
const MS_PER_CHAR = 620;

/**
 * Bomb fuse for a word at a level.
 *
 * Scales with word length — a nine-letter word on a fixed timer is a different
 * task from a three-letter one — and floors at 2.5s so it stays winnable no
 * matter how deep the run goes.
 *
 * The floor is a last resort, not an opening difficulty: with reaction time
 * folded in, a level-1 four-letter word gets over four seconds, and only a deep
 * run drives the fuse down to the floor.
 */
export function fuseMs(level: number, wordLength: number): number {
  const l = Math.max(1, level);
  const generous = REACTION_MS + Math.max(1, wordLength) * MS_PER_CHAR;
  const scaled = generous * Math.pow(0.92, l - 1);
  return Math.max(MIN_FUSE_MS, Math.round(scaled));
}
