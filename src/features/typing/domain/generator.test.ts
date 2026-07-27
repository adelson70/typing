import { describe, expect, it } from 'vitest';

import {
  createRng,
  dailySeed,
  generateDailyWords,
  generateWords,
  hashSeed,
  wordCountForDuration,
} from './generator';

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = Array.from({ length: 10 }, createRng(1));
    const b = Array.from({ length: 10 }, createRng(2));
    expect(a).not.toEqual(b);
  });

  it('stays within [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1_000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('hashSeed', () => {
  it('is stable for the same input', () => {
    expect(hashSeed('2026-07-27')).toBe(hashSeed('2026-07-27'));
  });

  it('differs for different inputs', () => {
    expect(hashSeed('2026-07-27')).not.toBe(hashSeed('2026-07-28'));
  });
});

describe('generateWords', () => {
  it('returns the requested number of words', () => {
    expect(generateWords({ sourceId: 'english-200', count: 25, seed: 1 })).toHaveLength(25);
  });

  it('is reproducible for a given seed', () => {
    const a = generateWords({ sourceId: 'english-200', count: 30, seed: 99 });
    const b = generateWords({ sourceId: 'english-200', count: 30, seed: 99 });
    expect(a).toEqual(b);
  });

  it('returns an empty list for an unknown source rather than throwing', () => {
    expect(generateWords({ sourceId: 'does-not-exist', count: 10 })).toEqual([]);
  });

  it('draws only from the requested source', () => {
    const words = generateWords({ sourceId: 'numbers', count: 40, seed: 5 });
    for (const word of words) {
      expect(word).toMatch(/^\d+$/);
    }
  });

  it('never yields an empty string', () => {
    const words = generateWords({ sourceId: 'symbols', count: 60, seed: 3 });
    expect(words.every((w) => w.length > 0)).toBe(true);
  });
});

describe('daily challenge', () => {
  it('gives every visitor the same words on the same UTC day', () => {
    const date = new Date('2026-07-27T00:00:00Z');
    const morning = generateDailyWords('english-200', 50, date);
    const evening = generateDailyWords('english-200', 50, new Date('2026-07-27T23:59:00Z'));
    expect(morning).toEqual(evening);
  });

  it('changes from day to day', () => {
    const today = generateDailyWords('english-200', 50, new Date('2026-07-27T12:00:00Z'));
    const tomorrow = generateDailyWords('english-200', 50, new Date('2026-07-28T12:00:00Z'));
    expect(today).not.toEqual(tomorrow);
  });

  it('derives the seed from the UTC date only', () => {
    expect(dailySeed(new Date('2026-07-27T01:00:00Z'))).toBe(
      dailySeed(new Date('2026-07-27T22:00:00Z')),
    );
  });
});

describe('wordCountForDuration', () => {
  it('generates enough words that a fast typist cannot exhaust the prompt', () => {
    // 60s at the 200 WPM ceiling.
    expect(wordCountForDuration(60)).toBeGreaterThanOrEqual(200);
  });

  it('keeps a floor for very short tests', () => {
    expect(wordCountForDuration(5)).toBeGreaterThanOrEqual(40);
  });

  it('scales with duration', () => {
    expect(wordCountForDuration(300)).toBeGreaterThan(wordCountForDuration(60));
  });
});
