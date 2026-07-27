/**
 * The game loop: requestAnimationFrame driving a fixed-timestep accumulator.
 *
 * The typing test samples on a 200ms interval, which is fine for a clock but
 * would render falling words at 5fps. Raw rAF would be smooth but
 * non-deterministic — frame times vary, so the same run would never reproduce
 * and none of the simulation could be unit tested.
 *
 * The accumulator resolves both: rAF supplies wall-clock deltas, this chops
 * them into fixed 16ms slices, and the reducer only ever sees whole steps.
 */

import { useEffect, useRef, useState } from 'react';

export const FIXED_STEP_MS = 16;

/**
 * Ceiling on catch-up per frame.
 *
 * Beyond this, elapsed time is dropped rather than simulated. A backgrounded
 * tab, a breakpoint or a long GC pause must not produce a burst of 1,800 steps
 * in one frame — the player would return to a screen full of words that fell
 * while they were not looking.
 */
export const MAX_FRAME_MS = 250;

export interface GameLoopOptions {
  readonly isRunning: boolean;
  /** Called once per `FIXED_STEP_MS` of simulated time. */
  readonly onStep: (dtMs: number) => void;
  /** Called once per rendered frame, after that frame's steps. */
  readonly onFrame?: (() => void) | undefined;
}

export function useGameLoop({ isRunning, onStep, onFrame }: GameLoopOptions): void {
  // Refs re-assigned each render, so the effect depends only on `isRunning` and
  // the loop is never torn down by a changed callback identity mid-run.
  const stepRef = useRef(onStep);
  const frameRef = useRef(onFrame);
  stepRef.current = onStep;
  frameRef.current = onFrame;

  useEffect(() => {
    if (!isRunning) return;

    let handle = 0;
    let last = performance.now();
    let accumulator = 0;

    const tick = (now: number): void => {
      accumulator += Math.min(now - last, MAX_FRAME_MS);
      last = now;

      while (accumulator >= FIXED_STEP_MS) {
        stepRef.current(FIXED_STEP_MS);
        accumulator -= FIXED_STEP_MS;
      }

      frameRef.current?.();
      handle = requestAnimationFrame(tick);
    };

    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [isRunning]);
}

/**
 * Whether the viewer asked for reduced motion.
 *
 * Read in JS rather than left to CSS because reduced motion must change how the
 * game *renders*, never how it *simulates* — a stepped Word Rain has to stay
 * the same difficulty, or scores would not be comparable between players.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefers(query.matches);

    const onChange = (event: MediaQueryListEvent): void => setPrefers(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return prefers;
}

/**
 * Whether the tab is hidden.
 *
 * rAF stops in a background tab, so the simulation pauses on its own — but the
 * wall clock does not. Pausing explicitly keeps `simulatedMs` honest and stops
 * a player returning to a game that "ran" while they were away.
 */
export function usePageHidden(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onChange = (): void => setHidden(document.hidden);
    onChange();
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return hidden;
}
