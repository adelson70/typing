/**
 * User settings: schema, validation, persistence and change notification.
 *
 * Settings are read before first paint and on every preference change, so they
 * live in LocalStorage (synchronous) rather than IndexedDB (async).
 */

import { LOCALES, type Locale } from '@/constants/i18n';
import { SETTINGS_SCHEMA_VERSION, SETTINGS_STORAGE_KEY } from '@/constants/storage';
import { readJson, writeJson } from './localStorage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type CaretStyle = 'block' | 'line' | 'underline';

export interface Settings {
  readonly version: number;
  readonly theme: ThemePreference;
  readonly locale: Locale;
  readonly soundEnabled: boolean;
  readonly smoothCaret: boolean;
  readonly caretStyle: CaretStyle;
  /** Hide correctness colouring while typing. */
  readonly blindMode: boolean;
  /** Refuse input that would be incorrect. */
  readonly stopOnError: boolean;
  /** Default timed-test duration in seconds. */
  readonly defaultDuration: number;
  readonly defaultSourceId: string;
}

export const DEFAULT_SETTINGS: Settings = {
  version: SETTINGS_SCHEMA_VERSION,
  theme: 'system',
  locale: 'en',
  soundEnabled: false,
  smoothCaret: true,
  caretStyle: 'line',
  blindMode: false,
  stopOnError: false,
  defaultDuration: 60,
  defaultSourceId: 'english-200',
};

const THEMES: readonly ThemePreference[] = ['light', 'dark', 'system'];
const CARET_STYLES: readonly CaretStyle[] = ['block', 'line', 'underline'];

/**
 * Structural validation of a persisted payload.
 *
 * Guards against an older schema version, a hand-edited value, or a partially
 * written object. Anything that fails falls back to defaults rather than
 * letting `undefined` reach the UI.
 */
function isSettings(value: unknown): value is Settings {
  if (typeof value !== 'object' || value === null) return false;

  const s = value as Record<string, unknown>;

  return (
    s['version'] === SETTINGS_SCHEMA_VERSION &&
    typeof s['theme'] === 'string' &&
    THEMES.includes(s['theme'] as ThemePreference) &&
    typeof s['locale'] === 'string' &&
    (LOCALES as readonly string[]).includes(s['locale']) &&
    typeof s['soundEnabled'] === 'boolean' &&
    typeof s['smoothCaret'] === 'boolean' &&
    typeof s['caretStyle'] === 'string' &&
    CARET_STYLES.includes(s['caretStyle'] as CaretStyle) &&
    typeof s['blindMode'] === 'boolean' &&
    typeof s['stopOnError'] === 'boolean' &&
    typeof s['defaultDuration'] === 'number' &&
    Number.isFinite(s['defaultDuration']) &&
    typeof s['defaultSourceId'] === 'string'
  );
}

export function loadSettings(): Settings {
  return readJson(SETTINGS_STORAGE_KEY, isSettings) ?? DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): boolean {
  return writeJson(SETTINGS_STORAGE_KEY, settings);
}

/** Applies a partial update, persists it, and notifies listeners. */
export function updateSettings(patch: Partial<Omit<Settings, 'version'>>): Settings {
  const next: Settings = { ...loadSettings(), ...patch, version: SETTINGS_SCHEMA_VERSION };
  saveSettings(next);
  notify(next);
  return next;
}

// --- Change notification --------------------------------------------------
// Components across islands need to react to a settings change without a
// shared framework store. A module-level listener set keeps islands in sync
// within the tab; the `storage` event covers other tabs.

type Listener = (settings: Settings) => void;

const listeners = new Set<Listener>();

function notify(settings: Settings): void {
  for (const listener of listeners) listener(settings);
}

export function subscribeToSettings(listener: Listener): () => void {
  listeners.add(listener);

  // Cross-tab synchronisation.
  const onStorage = (event: StorageEvent): void => {
    if (event.key === SETTINGS_STORAGE_KEY) listener(loadSettings());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}
