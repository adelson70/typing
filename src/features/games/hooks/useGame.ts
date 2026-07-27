/**
 * Binds the game loop, the reducer, keyboard input and the finish pipeline.
 *
 * The React-facing half of the games feature: everything worth asserting lives
 * below it in pure modules, so this hook stays thin enough to be reviewed by
 * reading it.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { generateWords } from '@/features/typing/domain/generator';
import { computeMetrics } from '@/features/typing/domain/metrics';
import { getWordSource } from '@/features/typing/data/wordlists';
import type { TypingMetrics } from '@/features/typing/domain/types';
import type { Locale } from '@/constants/i18n';
import { useRunPipeline } from '@/features/progression/hooks/useRunPipeline';
import type { XpAward } from '@/features/progression/domain/types';
import {
  applyGameRun,
  getGameStats,
  loadGames,
  saveGames,
  type GameRecord,
} from '@/services/storage/gameRepository';
import { loadProgress } from '@/services/storage/progressRepository';
import { toTypingCounters } from '../domain/counters';
import { createInitialGameState, reduceGame } from '../domain/gameEngine';
import { getGameMode } from '../domain/registry';
import { evaluateGameAchievements, toGameSnapshot } from '../domain/achievements';
import type { GameConfig, GameId, GameState } from '../domain/types';
import { useGameLoop, usePageHidden } from './useGameLoop';

/** Refill when the buffer runs below this, so the spawner never starves. */
const REFILL_THRESHOLD = 8;

export interface UseGameOptions {
  readonly gameId: GameId;
  readonly locale: Locale;
  readonly sourceId: string;
}

export interface UseGameResult {
  readonly state: GameState;
  readonly metrics: TypingMetrics;
  readonly isOver: boolean;
  /** XP earned by the finished run; null until scoring completes. */
  readonly award: XpAward | null;
  readonly unlockedIds: readonly string[];
  /** Best score before this run, so the HUD can show a target to beat. */
  readonly bestScore: number;
  readonly isNewBest: boolean;
  /** The run was too brief to earn XP, and the panel should say so. */
  readonly tooShort: boolean;
  readonly handleKeyDown: (event: React.KeyboardEvent | KeyboardEvent) => void;
  readonly restart: () => void;
  readonly quit: () => void;
}

function createId(completedAt: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${completedAt}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function useGame({ gameId, locale, sourceId }: UseGameOptions): UseGameResult {
  const config: GameConfig = useMemo(
    () => ({
      gameId,
      sourceId,
      locale,
      caseSensitive: getWordSource(sourceId)?.caseSensitive ?? false,
    }),
    [gameId, sourceId, locale],
  );

  const mode = getGameMode(gameId);

  const [state, dispatch] = useReducer(reduceGame, config, (c) =>
    createInitialGameState(c, []),
  );

  // Words are generated after mount, never during render: the generator seeds
  // itself from the clock, so calling it while rendering would produce
  // different markup on the server and the client.
  const [ready, setReady] = useState(false);
  const { completed, clear, submit } = useRunPipeline();
  const hasReported = useRef(false);
  const hidden = usePageHidden();

  // Read once per run rather than per render: this is the score to beat, so it
  // must not move while the player is beating it.
  const [bestScore, setBestScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [tooShort, setTooShort] = useState(false);

  const refill = useCallback(
    (count: number) => generateWords({ sourceId, count }),
    [sourceId],
  );

  const restart = useCallback(() => {
    hasReported.current = false;
    setIsNewBest(false);
    setTooShort(false);
    setBestScore(getGameStats(loadGames(), gameId).bestScore);
    clear();
    dispatch({ type: 'reset', words: refill(mode.bufferSize) });
    setReady(true);
  }, [refill, mode.bufferSize, gameId, clear]);

  useEffect(() => {
    restart();
  }, [restart]);

  // A hidden tab stops rAF anyway; pausing explicitly keeps the *clock* honest
  // so time away is not counted against the player's WPM.
  useEffect(() => {
    dispatch({ type: hidden ? 'pause' : 'resume' });
  }, [hidden]);

  const isOver = state.status === 'over';

  useGameLoop({
    isRunning: ready && !isOver && !hidden,
    onStep: useCallback((dtMs: number) => dispatch({ type: 'step', dtMs }), []),
  });

  // Top the buffer up ahead of the spawner rather than on demand, so a refill
  // never lands in the same frame a word is needed.
  useEffect(() => {
    if (!isOver && state.wordQueue.length < REFILL_THRESHOLD) {
      dispatch({ type: 'refill', words: refill(mode.bufferSize) });
    }
  }, [state.wordQueue.length, isOver, refill, mode.bufferSize]);

  const metrics = useMemo(
    () => computeMetrics(toTypingCounters(state.counters), state.samples, state.simulatedMs),
    [state.counters, state.samples, state.simulatedMs],
  );

  // Scoring runs once per finished game, guarded by a ref rather than by state
  // so a re-render cannot double-submit.
  useEffect(() => {
    if (!isOver || hasReported.current) return;
    hasReported.current = true;

    const completedAt = Date.now();
    const record: GameRecord = {
      id: createId(completedAt),
      gameId,
      completedAt,
      score: state.score,
      level: state.level,
      wordsDestroyed: state.counters.wordsDestroyed,
      wordsMissed: state.counters.wordsMissed,
      bestCombo: state.counters.bestCombo,
      durationMs: state.simulatedMs,
      wpm: metrics.wpm,
      accuracy: metrics.accuracy,
      xpAwarded: 0,
      locale,
      sourceId,
    };

    const stored = loadGames();
    // Compared before the fold, since applyGameRun raises the record itself.
    setIsNewBest(state.score > getGameStats(stored, gameId).bestScore);

    const games = applyGameRun(stored, record);
    saveGames(games);

    // Already-unlocked ids are excluded here, or every finished game would
    // re-celebrate the whole catalogue.
    const alreadyUnlocked = loadProgress().unlocked.map((entry) => entry.id);

    // A run too short to be a real attempt earns nothing. `calculateXp` already
    // zeroes below three seconds, but Survival can be ended deliberately in
    // four — so each mode sets its own floor.
    if (state.simulatedMs < mode.minRunMs) {
      setTooShort(true);
      return;
    }

    submit({
      metrics,
      bestCombo: state.counters.bestCombo,
      samples: state.samples,
      // No `persist`: a game must never reach test history, where it would skew
      // average WPM. XP and achievements still flow through the same path.
      persist: undefined,
      extraUnlockedIds: evaluateGameAchievements(toGameSnapshot(games, alreadyUnlocked)),
    });
  }, [isOver, gameId, locale, sourceId, state, metrics, submit, mode.minRunMs]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      if (event.metaKey || event.altKey) return;
      if (event.ctrlKey && event.key !== 'Backspace') return;

      const { key } = event;

      if (key === 'Backspace') {
        event.preventDefault();
        dispatch({ type: 'backspace' });
        return;
      }

      // Space is never a target character in a game — words are discrete — so
      // it would otherwise scroll the page.
      if (key === ' ') {
        event.preventDefault();
        return;
      }

      if (key.length !== 1) return;

      event.preventDefault();
      dispatch({ type: 'char', char: key });
    },
    [],
  );

  const quit = useCallback(() => {
    dispatch({ type: 'end', reason: 'quit' });
  }, []);

  return {
    state,
    metrics,
    isOver,
    award: completed?.award ?? null,
    unlockedIds: completed?.unlockedIds ?? [],
    bestScore,
    isNewBest,
    tooShort,
    handleKeyDown,
    restart,
    quit,
  };
}
