import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';
import { t } from '@/i18n/translations';
import type { Locale } from '@/constants/i18n';
import { loadSettings, updateSettings } from '@/services/storage/settings';
import { playKeySound, unlockAudio } from '../audio/keySound';

interface SoundToggleProps {
  readonly locale: Locale;
  readonly className?: string;
}

/**
 * Keystroke sound switch.
 *
 * Off by default. Audio that starts without being asked for is the fastest way
 * to make someone close a tab, and a typing test is often opened in an office.
 *
 * Turning it on plays one keystroke immediately: it doubles as the gesture that
 * unlocks the AudioContext, and it previews the sound so the choice is informed.
 */
export function SoundToggle({ locale, className }: SoundToggleProps) {
  const [enabled, setEnabled] = useState(false);

  // Read after mount so the server-rendered markup and first client render
  // agree.
  useEffect(() => {
    setEnabled(loadSettings().soundEnabled);
  }, []);

  const toggle = (): void => {
    const next = !enabled;
    setEnabled(next);
    updateSettings({ soundEnabled: next });

    if (next) {
      unlockAudio();
      playKeySound('key');
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      className={cn(
        'inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-fast',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        enabled
          ? 'bg-energy-muted text-energy'
          : 'text-fg-subtle hover:bg-surface-raised hover:text-fg',
        className,
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {enabled ? (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 5a10 10 0 0 1 0 14" />
          </>
        ) : (
          <path d="M22 9l-6 6M16 9l6 6" />
        )}
      </svg>
      {t(locale, 'settings.sound')}
    </button>
  );
}
