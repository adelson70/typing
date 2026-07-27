/**
 * Which falling word is being typed.
 *
 * The crux of Word Rain. Kept pure and separate from the reducer because the
 * rule has more edge cases than the rest of the game put together, and because
 * a targeting bug reads to the player as the game cheating.
 */

import { judgeChar } from '@/features/typing/domain/judge';

export interface TargetCandidate {
  readonly id: string;
  readonly word: string;
  /** Vertical position, 0 = spawn line, 1 = floor. */
  readonly y: number;
  /** Horizontal lane, 0–1. Tie-breaker only. */
  readonly x: number;
  /** Correctly typed prefix so far. */
  readonly typed: string;
}

export interface TargetResolution {
  readonly targetId: string | null;
  /** True when the keystroke advanced a target. */
  readonly accepted: boolean;
}

function normalise(value: string, caseSensitive: boolean): string {
  return caseSensitive ? value : value.toLowerCase();
}

/**
 * Resolves a keystroke against the words on screen.
 *
 * Rules, in order:
 *
 * 1. **A held target keeps the keystroke.** While a word is locked, the key is
 *    judged only against it. A wrong key is an error that keeps the lock — if a
 *    mistype could silently re-target, the player's progress would appear to
 *    teleport to another word, which reads as a bug rather than as their error.
 * 2. **Acquisition** matches the first character against every candidate.
 * 3. **The lowest word wins**, so the optimal play (clear the most urgent
 *    threat) is also the natural one (just start typing it).
 * 4. **Ties break left-first, then by id** — spawns arrive in batches, so ties
 *    are common and the resolution has to be deterministic to be testable.
 * 5. **No match is an error**, not silence: a key that hits nothing is still a
 *    mistake and accuracy should say so.
 */
export function resolveTarget(
  candidates: readonly TargetCandidate[],
  lockedId: string | null,
  char: string,
  caseSensitive = false,
): TargetResolution {
  const locked = lockedId === null ? undefined : candidates.find((c) => c.id === lockedId);

  if (locked) {
    const verdict = judgeChar(
      normalise(locked.word, caseSensitive),
      locked.typed.length,
      normalise(char, caseSensitive),
    );
    return { targetId: locked.id, accepted: verdict === 'correct' };
  }

  const matches = candidates.filter(
    (candidate) =>
      judgeChar(
        normalise(candidate.word, caseSensitive),
        candidate.typed.length,
        normalise(char, caseSensitive),
      ) === 'correct',
  );

  if (matches.length === 0) return { targetId: null, accepted: false };

  const best = matches.reduce((lowest, candidate) => {
    if (candidate.y !== lowest.y) return candidate.y > lowest.y ? candidate : lowest;
    if (candidate.x !== lowest.x) return candidate.x < lowest.x ? candidate : lowest;
    return candidate.id < lowest.id ? candidate : lowest;
  });

  return { targetId: best.id, accepted: true };
}
