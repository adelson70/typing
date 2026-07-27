/**
 * Storage keys and schema versions.
 *
 * Centralised so a key is never typed as a literal at a call site — renaming a
 * key silently orphaning user data is the classic bug this file prevents.
 *
 * The `ts:` prefix namespaces the origin, avoiding collisions if the domain
 * ever hosts anything else.
 */

export const THEME_STORAGE_KEY = 'ts:theme' as const;
export const SETTINGS_STORAGE_KEY = 'ts:settings' as const;
export const LOCALE_STORAGE_KEY = 'ts:locale' as const;
export const ONBOARDING_STORAGE_KEY = 'ts:onboarding-seen' as const;
export const INSTALL_PROMPT_KEY = 'ts:install-dismissed' as const;

/** IndexedDB */
export const DB_NAME = 'typing-studio' as const;
export const DB_VERSION = 1 as const;

export const STORE_RESULTS = 'results' as const;
export const STORE_DAILY = 'daily' as const;
export const STORE_KEY_STATS = 'keyStats' as const;
export const STORE_ACHIEVEMENTS = 'achievements' as const;
export const STORE_LESSON_PROGRESS = 'lessonProgress' as const;

/**
 * Game records and high scores.
 *
 * Deliberately LocalStorage rather than a new IndexedDB store: bumping
 * `DB_VERSION` triggers an upgrade for every existing user, and `openDatabase`
 * resolves null when a second tab blocks it — losing access to all history for
 * the sake of a handful of high scores. Games also need a synchronous read to
 * render "your best" without a flash.
 */
export const GAMES_STORAGE_KEY = 'ts:games' as const;

/**
 * Bumped when a persisted payload's shape changes. Migration logic reads this
 * to decide whether stored data can be trusted or must be discarded.
 */
export const SETTINGS_SCHEMA_VERSION = 1 as const;
export const GAMES_SCHEMA_VERSION = 1 as const;
