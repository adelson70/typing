import { cn } from '@/lib/cn';
import type { WordCell } from '../domain/types';

interface TypingLineProps {
  readonly cells: readonly WordCell[];
  readonly input: string;
  readonly isActive: boolean;
  /** Changes whenever the test restarts, so the strip can snap back. */
  readonly resetKey: number;
}

/** Left inset so the caret never sits flush against the container edge. */
const PROMPT_INSET = '0.5rem';

/**
 * Single-line typing strip.
 *
 * The prompt is one horizontal row with the active word always leftmost. It does
 * not scroll: `buildWordCells` drops each word as it is completed, so the row
 * renews from the front and the caret stays at a fixed point. The eye therefore
 * never has to track a moving cursor or find it again after a line break.
 *
 * Nothing here is dimmed except words already finished. An earlier version faded
 * the container edges and dimmed upcoming words; both obscured the text the
 * player reads ahead of the caret, which is the one thing they are always doing.
 */

export function TypingLine({ cells, input, isActive, resetKey }: TypingLineProps) {
  return (
    <div
      className="relative overflow-hidden"
      // A fixed height stops the arena from resizing between states, which
      // would shift everything below it on every restart.
      style={{ height: '4.5rem' }}
    >
      {/*
        No edge fades.
        An earlier version faded both ends to signal that the strip continues.
        In practice the left fade washed out the word being typed and the right
        fade dimmed the words being read ahead — it obscured exactly the two
        things the player needs to see. Overflow alone communicates continuation.
      */}

      <div
        data-typing-strip
        className="absolute top-1/2 flex -translate-y-1/2 items-baseline whitespace-nowrap"
        style={{ left: PROMPT_INSET }}
        aria-hidden="true"
      >
        {cells.map((word, wordIndex) => {
          const isCurrent = wordIndex === 0 && isActive;

          return (
            <span
              key={`${resetKey}-${wordIndex}`}
              className={cn(
                'relative mr-[0.55em] font-mono text-type-lg leading-none transition-opacity duration-normal',
                // Only *completed* words recede. Dimming upcoming words as well
                // made the text harder to read ahead of the caret, which is the
                // one thing a typist is constantly doing.
                word.isComplete ? 'opacity-45' : 'opacity-100',
                word.hasError &&
                  !isCurrent &&
                  'underline decoration-danger-500/70 decoration-2 underline-offset-[6px]',
              )}
            >
              {word.chars.map((cell, charIndex) => {
                const showCaret = isCurrent && charIndex === input.length;

                return (
                  <span
                    key={charIndex}
                    className={cn(
                      'relative',
                      cell.state === 'pending' && 'text-type-pending',
                      cell.state === 'correct' && 'text-type-correct',
                      cell.state === 'incorrect' &&
                        'rounded-xs bg-type-incorrect-bg text-type-incorrect',
                    )}
                  >
                    {showCaret && <Caret />}
                    {cell.char}
                  </span>
                );
              })}

              {word.extras.map((cell, index) => (
                <span key={`x-${index}`} className="text-type-incorrect opacity-70">
                  {cell.char}
                </span>
              ))}

              {/* Caret parks after the final character when the word is overtyped. */}
              {isCurrent && input.length >= word.chars.length && (
                <span className="relative">
                  <Caret />
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The typing caret.
 *
 * `ts-caret` is targeted by the reduced-motion rule in global.css, which stops
 * the blink but keeps the caret visible.
 */
function Caret() {
  return (
    <span
      className="ts-caret absolute -left-0.5 top-1/2 h-[1.15em] w-[3px] -translate-y-1/2 animate-pulse rounded-full bg-type-caret"
      aria-hidden="true"
    />
  );
}
