import { t } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { cn } from '@/lib/cn';
import type { GameState, WordEntity } from '../../domain/types';

interface WordRainStageProps {
  readonly locale: Locale;
  readonly state: GameState;
  readonly reducedMotion: boolean;
}

/** Discrete rows used under reduced motion, instead of continuous falling. */
const ROWS = 8;

/**
 * The falling-words stage.
 *
 * DOM rather than canvas: the words are real text, so they inherit the site's
 * font and theme tokens, and a screen reader can read the target. The worst
 * case is ~18 words on screen, which is nothing for the compositor as long as
 * each one is absolutely positioned (out of flow, so moving one never reflows
 * its siblings).
 *
 * The stage height is capped against the viewport rather than fixed. The floor
 * gauge is what decides when a run ends, so a player must never have to scroll
 * to see how close they are to losing.
 */
export function WordRainStage({ locale, state, reducedMotion }: WordRainStageProps) {
  return (
    <div className="relative h-[min(60vh,26rem)] overflow-hidden rounded-xl bg-surface-raised">
      {state.entities.length === 0 && state.simulatedMs < 1_000 && (
        <p className="absolute inset-x-0 top-1/2 text-center text-sm text-fg-subtle">
          {t(locale, 'game.startHint')}
        </p>
      )}

      {state.entities.map((entity) => (
        <FallingWord
          key={entity.id}
          entity={entity}
          isTarget={entity.id === state.targetId}
          reducedMotion={reducedMotion}
        />
      ))}

      {/* Survival shares this stage but has no floor to fill — showing an
          always-empty gauge would imply a threat that does not exist there. */}
      {state.config.gameId === 'word-rain' && <Floor level={state.floor} locale={locale} />}
    </div>
  );
}

function FallingWord({
  entity,
  isTarget,
  reducedMotion,
}: {
  readonly entity: WordEntity;
  readonly isTarget: boolean;
  readonly reducedMotion: boolean;
}) {
  // Under reduced motion the word steps between discrete rows rather than
  // gliding. The simulation is untouched — it falls at the same speed and dies
  // at the same moment — so scores stay comparable between players.
  const y = reducedMotion ? Math.floor(entity.y * ROWS) / ROWS : entity.y;

  const chars = [...entity.word];

  return (
    <div
      // Positioned with `left`/`top`, NOT a percentage `translate`: percentages
      // in a transform resolve against the element's own box, so a 60px word
      // would move 60px rather than across the stage — which piled every word
      // into the top-left corner. `translate(-50%, -50%)` re-centres on the
      // point, and that one is meant to be self-relative.
      className="absolute font-mono text-lg whitespace-nowrap"
      style={{
        // 6%–94% keeps a long word clear of both edges; 4%–86% keeps it clear
        // of the top edge and the floor bar.
        left: `${6 + entity.x * 88}%`,
        top: `${4 + y * 82}%`,
        transform: 'translate(-50%, -50%)',
      }}
      aria-hidden="true"
    >
      {chars.map((char, index) => {
        const isTyped = index < entity.typed.length;
        const isNext = isTarget && index === entity.typed.length;

        return (
          <span
            key={index}
            className={cn(
              'transition-colors duration-fast',
              // A typed letter reads as spent; the next one is the only thing
              // the player has to look at, so it carries the emphasis.
              isTyped && 'text-accent opacity-40',
              isNext && 'rounded-sm bg-accent px-0.5 font-bold text-accent-fg',
              !isTyped && !isNext && (isTarget ? 'text-fg' : 'text-fg-muted'),
            )}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}

function Floor({ level, locale }: { readonly level: number; readonly locale: Locale }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 h-2 bg-border"
      role="progressbar"
      aria-valuenow={Math.round(level * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t(locale, 'game.floor')}
    >
      <div
        className="h-full bg-type-incorrect transition-[width] duration-fast"
        style={{ width: `${Math.min(100, level * 100)}%` }}
      />
    </div>
  );
}
