import type { Locale } from '@/constants/i18n';
import type { GameState } from '../domain/types';
import { BombStage } from './stages/BombStage';
import { WordRainStage } from './stages/WordRainStage';

interface GameStageProps {
  readonly locale: Locale;
  readonly state: GameState;
  readonly reducedMotion: boolean;
}

/**
 * Picks the renderer for the running game.
 *
 * Survival shares Word Rain's stage deliberately: the two look the same because
 * they *are* the same board — what differs is the rule for ending a run, and a
 * second near-identical renderer would only be somewhere for the two to drift
 * apart. The floor bar reads as inert in Survival, which is honest: there is no
 * floor to fill, only one mistake to avoid.
 */
export function GameStage({ locale, state, reducedMotion }: GameStageProps) {
  if (state.config.gameId === 'bomb-defusal') {
    return <BombStage locale={locale} state={state} reducedMotion={reducedMotion} />;
  }

  return <WordRainStage locale={locale} state={state} reducedMotion={reducedMotion} />;
}
