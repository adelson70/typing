/**
 * Typed, fail-safe LocalStorage access.
 *
 * Every operation is wrapped: Safari private mode throws on write, storage can
 * be full, and users can disable it entirely. A settings write must never break
 * a typing test, so all failures degrade to in-memory behaviour instead of
 * propagating.
 */

/** SSR guard — these modules are imported by components that prerender. */
export const isBrowser = typeof window !== 'undefined';

function safeStorage(): Storage | null {
  if (!isBrowser) return null;
  try {
    const probe = '__ts_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Reads and validates a persisted value.
 *
 * `validate` is required rather than optional: data from a previous schema
 * version, another tab, or a user editing devtools cannot be trusted to match
 * `T`, and an unchecked cast is how corrupt state reaches the UI.
 */
export function readJson<T>(key: string, validate: (value: unknown) => value is T): T | null {
  const storage = safeStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : null;
  } catch {
    // Malformed JSON — discard rather than leaving a poison value in place.
    try {
      storage.removeItem(key);
    } catch {
      /* nothing further we can do */
    }
    return null;
  }
}

/** Persists a value. Returns false when storage is unavailable or full. */
export function writeJson(key: string, value: unknown): boolean {
  const storage = safeStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    safeStorage()?.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Reads a plain string, constrained to an allowed set. */
export function readEnum<T extends string>(
  key: string,
  allowed: readonly T[],
): T | null {
  const storage = safeStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): boolean {
  const storage = safeStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
