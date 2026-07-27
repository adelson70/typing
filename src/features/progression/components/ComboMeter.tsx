import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { t } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';

interface ComboMeterProps {
  readonly locale: Locale;
  readonly combo: number;
  readonly className?: string;
}

/**
 * Combo tiers.
 *
 * Thresholds are close together at the start and widen as they climb: the first
 * tier arrives quickly enough to teach the player that the meter exists, while
 * the later ones stay rare enough to feel earned. A single linear scale would
 * either never trigger or stop meaning anything.
 */
interface ComboTier {
  readonly at: number;
  readonly label: string | null;
  readonly ring: string;
  readonly text: string;
}

const BASE_TIER: ComboTier = { at: 0, label: null, ring: '', text: 'text-fg-subtle' };

const TIERS: readonly ComboTier[] = [
  BASE_TIER,
  { at: 10, label: 'Nice', ring: 'ring-1 ring-ember-700/40', text: 'text-ember-300' },
  { at: 30, label: 'Great', ring: 'ring-1 ring-ember-500/50', text: 'text-ember-400' },
  { at: 60, label: 'Hot', ring: 'ring-2 ring-ember-400/60', text: 'text-ember-400' },
  { at: 120, label: 'On fire', ring: 'ring-2 ring-ember-300/70', text: 'text-ember-300' },
  { at: 250, label: 'Unreal', ring: 'ring-2 ring-ember-200/80', text: 'text-ember-200' },
];

function tierFor(combo: number): ComboTier {
  let match = BASE_TIER;
  for (const tier of TIERS) {
    if (combo >= tier.at) match = tier;
  }
  return match;
}

/**
 * Live combo counter.
 *
 * Deliberately understated below the first tier: a meter that shouts at "3
 * correct characters" trains the player to ignore it, so it stays quiet until
 * the streak is genuinely worth protecting. From there the escalating label and
 * ring supply the variable reward that makes the next character feel worth
 * getting right.
 *
 * Not announced to screen readers on every change — that would be unusable
 * during typing. The final combo is reported once, in the results panel.
 */
export function ComboMeter({ locale, combo, className }: ComboMeterProps) {
  const tier = tierFor(combo);
  const isActive = combo >= 10;

  /*
   * Pulse only when a *tier* is crossed, not on every increment.
   *
   * Animating each keystroke would fire dozens of times a second and read as
   * flicker; firing at the threshold makes the escalation legible.
   */
  const previousTier = useRef(tier.at);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (tier.at > previousTier.current) setPulse((n) => n + 1);
    previousTier.current = tier.at;
  }, [tier.at]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-fast',
        isActive ? cn('bg-energy-muted', tier.ring) : 'bg-transparent',
        className,
      )}
      aria-hidden="true"
    >
      <span
        key={pulse}
        className={cn(
          'font-mono text-lg font-bold tabular-nums transition-colors duration-fast',
          tier.text,
          pulse > 0 && 'ts-pop',
        )}
      >
        {combo}
      </span>
      <span className="text-2xs font-medium uppercase tracking-wider text-fg-subtle">
        {tier.label ?? t(locale, 'xp.combo')}
      </span>
    </div>
  );
}
