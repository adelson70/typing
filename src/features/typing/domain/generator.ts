/**
 * Deterministic word generation.
 *
 * A seeded PRNG rather than `Math.random()` so that:
 *   - the daily challenge is identical for every visitor without a server,
 *   - a result can be replayed or shared and reproduce the same prompt,
 *   - tests are deterministic.
 */

import { getWordSource, type WordSource } from '../data/wordlists';

/**
 * mulberry32 — small, fast, well-distributed 32-bit PRNG.
 * Chosen over an LCG because low bits stay well-mixed, which matters when
 * mapping onto small word-list lengths.
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a: stable string → 32-bit seed, so a date string maps to a fixed test. */
export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export interface GenerateOptions {
  readonly sourceId: string;
  readonly count: number;
  readonly seed?: number;
  /** Avoid repeating the immediately preceding word. */
  readonly avoidRepeats?: boolean;
}

/**
 * Monotonic counter mixed into unseeded seeds.
 *
 * `Date.now()` alone has millisecond resolution, so two tests generated in the
 * same millisecond — restarting quickly, or rendering two arenas — produced an
 * identical prompt. The counter guarantees successive calls differ.
 */
let generationCounter = 0;

/**
 * Produces the prompt word list.
 *
 * Without a seed, derives one from the clock and a counter so consecutive
 * tests differ. Pass an explicit seed for reproducible prompts.
 */
export function generateWords(options: GenerateOptions): readonly string[] {
  const source: WordSource | undefined = getWordSource(options.sourceId);
  if (!source || source.words.length === 0) return [];

  const { words } = source;
  generationCounter += 1;
  const seed =
    options.seed ?? hashSeed(`${Date.now()}-${generationCounter}-${options.sourceId}`);
  const rng = createRng(seed);
  const avoidRepeats = options.avoidRepeats ?? true;

  const result: string[] = [];
  let previous = '';

  for (let i = 0; i < options.count; i += 1) {
    let word = words[Math.floor(rng() * words.length)] ?? '';

    // One retry is enough to break runs without risking a long loop on a
    // single-entry list.
    if (avoidRepeats && word === previous && words.length > 1) {
      word = words[Math.floor(rng() * words.length)] ?? word;
    }

    result.push(word);
    previous = word;
  }

  return result;
}

/**
 * The seed for a given day, in UTC.
 *
 * UTC — not local time — so every visitor worldwide shares one daily challenge
 * and the leaderboard comparison stays meaningful.
 */
export function dailySeed(date: Date = new Date()): number {
  const iso = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return hashSeed(`daily-${iso}`);
}

/** The daily challenge word list. */
export function generateDailyWords(sourceId: string, count = 50, date?: Date): readonly string[] {
  return generateWords({
    sourceId,
    count,
    seed: dailySeed(date),
  });
}

/**
 * How many words to generate for a timed test.
 *
 * Overshoots deliberately: running out of prompt mid-test is far worse than
 * generating words nobody reaches. 200 WPM is a generous ceiling.
 */
export function wordCountForDuration(seconds: number): number {
  const CEILING_WPM = 200;
  return Math.max(40, Math.ceil((seconds / 60) * CEILING_WPM));
}
