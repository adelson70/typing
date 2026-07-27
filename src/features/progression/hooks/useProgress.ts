import { useCallback, useEffect, useState } from 'react';

import { levelFromXp } from '../domain/xp';
import type { LevelInfo, ProgressState } from '../domain/types';
import {
  EMPTY_PROGRESS,
  applyProgress,
  loadProgress,
  saveProgress,
  type ProgressUpdate,
} from '@/services/storage/progressRepository';

export interface UseProgressResult {
  readonly progress: ProgressState;
  readonly level: LevelInfo;
  /** False until LocalStorage has been read, so the HUD can avoid a flash. */
  readonly isReady: boolean;
  readonly record: (update: ProgressUpdate) => ProgressState;
}

/**
 * Reads and writes progression.
 *
 * The initial state is the empty record rather than the stored one: reading
 * LocalStorage during render would make the server-rendered HTML disagree with
 * the client's first paint. The real value arrives in an effect, and `isReady`
 * lets the HUD hold its shape until then instead of flashing "Level 1".
 */
export function useProgress(): UseProgressResult {
  const [progress, setProgress] = useState<ProgressState>(EMPTY_PROGRESS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setIsReady(true);
  }, []);

  const record = useCallback((update: ProgressUpdate): ProgressState => {
    // Read the stored value again rather than trusting React state: another tab
    // may have recorded a test since this component mounted, and overwriting
    // with stale state would silently discard that XP.
    const next = applyProgress(loadProgress(), update);
    saveProgress(next);
    setProgress(next);
    return next;
  }, []);

  return {
    progress,
    level: levelFromXp(progress.totalXp),
    isReady,
    record,
  };
}
