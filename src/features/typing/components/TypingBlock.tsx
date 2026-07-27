import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import type { CodeLineCells } from '../domain/codeEngine';

interface TypingBlockProps {
  readonly lines: readonly CodeLineCells[];
  readonly input: string;
  readonly lineIndex: number;
  readonly isActive: boolean;
  readonly resetKey: number;
}

/**
 * Multi-line code arena.
 *
 * Code needs structure that a single scrolling line cannot express — indentation
 * only means anything when there are lines to indent relative to. So the block
 * layout is used for code modes while prose keeps the single-line tape.
 *
 * Indentation is rendered as a dim guide rather than as characters awaiting
 * input, because the engine supplies it. That is the visible half of the rule
 * enforced in `codeEngine`: the player positions on it but is never scored for it.
 */
export function TypingBlock({
  lines,
  input,
  lineIndex,
  isActive,
  resetKey,
}: TypingBlockProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  /**
   * Keeps the active line at a fixed height in the viewport.
   *
   * Scrolling the block rather than the page means the surrounding chrome never
   * moves while typing, and the eye does not have to re-find the caret after a
   * line break.
   */
  useEffect(() => {
    const viewport = viewportRef.current;
    const active = activeLineRef.current;
    if (!viewport || !active) return;

    // Anchor at 38%: enough context above to see what was just typed, and more
    // room below for what is coming.
    const anchor = viewport.clientHeight * 0.38;
    setOffset(Math.min(0, anchor - active.offsetTop));
  }, [lineIndex, resetKey]);

  return (
    <div
      ref={viewportRef}
      className="relative overflow-hidden"
      // Fixed height so the arena never resizes between snippets, which would
      // shift everything below it.
      style={{ height: '16rem' }}
    >
      {/* No edge fades: the bottom one dimmed the lines being read ahead, which
          is the opposite of what a typist needs. Overflow alone is enough. */}

      <div
        data-typing-block
        className="absolute inset-x-0 top-0 will-change-transform"
        style={{
          transform: `translate3d(0, ${offset}px, 0)`,
          transition: 'transform 220ms cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        aria-hidden="true"
      >
        {lines.map((line, index) => {
          const isCurrent = index === lineIndex && isActive;

          return (
            <div
              key={`${resetKey}-${index}`}
              ref={isCurrent ? activeLineRef : undefined}
              className={cn(
                'flex items-start gap-3 rounded-md px-3 py-1 font-mono text-type-sm leading-relaxed transition-colors duration-normal',
                isCurrent && 'bg-type-current-bg',
                // Completed lines recede; upcoming ones stay fully legible.
                line.isComplete && 'opacity-45',
              )}
            >
              {/* Line numbers orient the reader in a way prose never needs. */}
              <span className="w-6 shrink-0 select-none text-right text-2xs text-fg-subtle">
                {index + 1}
              </span>

              <span className="min-w-0 flex-1 whitespace-pre">
                {/* Auto-inserted indentation, shown as a guide. */}
                {line.indent.map((cell, cellIndex) => (
                  <span key={`i-${cellIndex}`} className="text-type-pending opacity-30">
                    {cell.char}
                  </span>
                ))}

                {line.chars.map((cell, charIndex) => {
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

                {line.extras.map((cell, extraIndex) => (
                  <span key={`x-${extraIndex}`} className="text-type-incorrect opacity-70">
                    {cell.char}
                  </span>
                ))}

                {/* Caret parks at the end of a finished line, where Enter is due. */}
                {isCurrent && input.length >= line.chars.length && (
                  <span className="relative">
                    <Caret />
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The typing caret. `ts-caret` is targeted by the reduced-motion rule in
 * global.css, which stops the blink but keeps the caret visible.
 */
function Caret() {
  return (
    <span
      className="ts-caret absolute -left-px top-1/2 h-[1.2em] w-[2px] -translate-y-1/2 animate-pulse rounded-full bg-type-caret"
      aria-hidden="true"
    />
  );
}
