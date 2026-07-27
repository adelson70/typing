import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  EMPTY_GAMES,
  MAX_RECORDS_PER_GAME,
  applyGameRun,
  combinedStreak,
  gameStreak,
  getGameStats,
  type GameRecord,
  type GamesState,
} from './gameRepository';

function record(overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    id: 'r1',
    gameId: 'word-rain',
    completedAt: Date.parse('2026-07-27T12:00:00Z'),
    score: 500,
    level: 4,
    wordsDestroyed: 30,
    wordsMissed: 3,
    bestCombo: 40,
    durationMs: 90_000,
    wpm: 55,
    accuracy: 94,
    xpAwarded: 300,
    locale: 'en',
    sourceId: 'english-200',
    ...overrides,
  };
}

describe('applyGameRun', () => {
  it('never lowers a stored best score', () => {
    const high = applyGameRun(EMPTY_GAMES, record({ score: 900 }));
    const low = applyGameRun(high, record({ id: 'r2', score: 100 }));

    expect(getGameStats(low, 'word-rain').bestScore).toBe(900);
  });

  it('never lowers a stored best combo or best WPM', () => {
    const first = applyGameRun(EMPTY_GAMES, record({ bestCombo: 120, wpm: 80 }));
    const second = applyGameRun(first, record({ id: 'r2', bestCombo: 5, wpm: 20 }));
    const stats = getGameStats(second, 'word-rain');

    expect(stats.bestCombo).toBe(120);
    expect(stats.bestWpm).toBe(80);
  });

  it('accumulates runs, words destroyed and time played', () => {
    let state = applyGameRun(EMPTY_GAMES, record({ wordsDestroyed: 10, durationMs: 60_000 }));
    state = applyGameRun(state, record({ id: 'r2', wordsDestroyed: 15, durationMs: 30_000 }));
    const stats = getGameStats(state, 'word-rain');

    expect(stats.runs).toBe(2);
    expect(stats.totalWordsDestroyed).toBe(25);
    expect(stats.totalTimeMs).toBe(90_000);
  });

  it('keeps each game’s records separate, so one cannot overwrite another', () => {
    let state = applyGameRun(EMPTY_GAMES, record({ gameId: 'word-rain', score: 100 }));
    state = applyGameRun(state, record({ id: 'r2', gameId: 'survival', score: 900 }));

    expect(getGameStats(state, 'word-rain').bestScore).toBe(100);
    expect(getGameStats(state, 'survival').bestScore).toBe(900);
  });

  it('caps stored records so a long-playing user cannot exhaust localStorage', () => {
    let state: GamesState = EMPTY_GAMES;
    for (let i = 0; i < MAX_RECORDS_PER_GAME + 20; i += 1) {
      state = applyGameRun(state, record({ id: `r${i}` }));
    }

    expect(state.records).toHaveLength(MAX_RECORDS_PER_GAME);
    // The cap must drop the oldest, not the newest.
    expect(state.records.at(-1)?.id).toBe(`r${MAX_RECORDS_PER_GAME + 19}`);
  });

  it('caps each game independently rather than sharing one budget', () => {
    let state: GamesState = EMPTY_GAMES;
    for (let i = 0; i < MAX_RECORDS_PER_GAME + 5; i += 1) {
      state = applyGameRun(state, record({ id: `a${i}`, gameId: 'word-rain' }));
    }
    state = applyGameRun(state, record({ id: 'b1', gameId: 'survival' }));

    expect(state.records.filter((r) => r.gameId === 'survival')).toHaveLength(1);
  });

  it('records the day played only once, however many runs it holds', () => {
    let state = applyGameRun(EMPTY_GAMES, record());
    state = applyGameRun(state, record({ id: 'r2' }));

    expect(state.playedDays).toEqual(['2026-07-27']);
  });
});

describe('gameStreak', () => {
  const at = (day: string): number => Date.parse(`${day}T12:00:00Z`);

  it('counts consecutive days ending today', () => {
    const state: GamesState = {
      ...EMPTY_GAMES,
      playedDays: ['2026-07-25', '2026-07-26', '2026-07-27'],
    };

    expect(gameStreak(state, at('2026-07-27'))).toBe(3);
  });

  it('accepts yesterday as the anchor, so an unplayed today is not a break', () => {
    const state: GamesState = { ...EMPTY_GAMES, playedDays: ['2026-07-25', '2026-07-26'] };

    expect(gameStreak(state, at('2026-07-27'))).toBe(2);
  });

  it('reports no streak once two days have passed', () => {
    const state: GamesState = { ...EMPTY_GAMES, playedDays: ['2026-07-24'] };

    expect(gameStreak(state, at('2026-07-27'))).toBe(0);
  });

  it('stops at the first gap rather than counting every day ever played', () => {
    const state: GamesState = {
      ...EMPTY_GAMES,
      playedDays: ['2026-07-20', '2026-07-26', '2026-07-27'],
    };

    expect(gameStreak(state, at('2026-07-27'))).toBe(2);
  });
});

describe('combinedStreak', () => {
  const at = (day: string): number => Date.parse(`${day}T12:00:00Z`);

  it('lets a game day bridge a gap between test days', () => {
    // Playing keeps the habit alive without writing to test history — the whole
    // reason game records are stored separately.
    expect(combinedStreak(['2026-07-26'], ['2026-07-25', '2026-07-27'], at('2026-07-27'))).toBe(3);
  });

  it('counts a day once when both a test and a game happened on it', () => {
    expect(combinedStreak(['2026-07-27'], ['2026-07-27'], at('2026-07-27'))).toBe(1);
  });
});

describe('module boundaries', () => {
  it('does not write to the results store', () => {
    // Structural, not behavioural: the isolation guarantee is that this module
    // cannot reach test history at all, and an import is how that would start.
    // Matched against imports rather than the whole file, so the comments that
    // explain the rule do not trip it.
    const source = readFileSync(new URL('./gameRepository.ts', import.meta.url), 'utf8');
    const imports = source.match(/^\s*import[\s\S]*?from\s+'[^']+';/gm) ?? [];

    for (const statement of imports) {
      expect(statement, 'game storage must not reach test history').not.toMatch(
        /resultsRepository|indexedDb/,
      );
    }
  });
});
