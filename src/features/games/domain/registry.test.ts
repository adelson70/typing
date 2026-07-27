import { describe, expect, it } from 'vitest';

import { GAME_IDS, GAME_MODES, GAME_ROUTE_KEYS, getGameMode, isGameId } from './registry';

describe('game registry', () => {
  it('gives every game a unique id', () => {
    expect(new Set(GAME_IDS).size).toBe(GAME_IDS.length);
  });

  it('gives every game a unique, slug-shaped route key', () => {
    expect(new Set(GAME_ROUTE_KEYS).size).toBe(GAME_ROUTE_KEYS.length);
    for (const key of GAME_ROUTE_KEYS) {
      expect(key).toMatch(/^games\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('resolves every registered id', () => {
    for (const id of GAME_IDS) {
      expect(getGameMode(id).id).toBe(id);
    }
  });

  it('throws on an unknown id rather than silently running another game', () => {
    // A fallback would turn a typo in a route into a game that quietly behaves
    // like a different one — far harder to notice than a crash.
    expect(() => getGameMode('nope' as never)).toThrow();
  });

  it('recognises only registered ids', () => {
    expect(isGameId('word-rain')).toBe(true);
    expect(isGameId('nope')).toBe(false);
  });

  it('requires a run long enough that XP cannot be farmed by quitting early', () => {
    for (const mode of GAME_MODES) {
      expect(mode.minRunMs).toBeGreaterThanOrEqual(5_000);
    }
  });

  it('buffers enough words that the spawner never starves', () => {
    for (const mode of GAME_MODES) {
      expect(mode.bufferSize).toBeGreaterThanOrEqual(18);
    }
  });
});
