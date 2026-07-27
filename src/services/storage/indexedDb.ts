/**
 * Minimal promise wrapper over IndexedDB.
 *
 * Hand-rolled rather than pulling in a library: the surface needed here is
 * small, and shipping zero extra bytes to every page matters more than the
 * convenience. Every call resolves rather than rejecting on environment
 * failure — a browser with IndexedDB blocked (private mode, embedded webview)
 * must still allow typing, just without history.
 */

import {
  DB_NAME,
  DB_VERSION,
  STORE_ACHIEVEMENTS,
  STORE_DAILY,
  STORE_KEY_STATS,
  STORE_LESSON_PROGRESS,
  STORE_RESULTS,
} from '@/constants/storage';

export type StoreName =
  | typeof STORE_RESULTS
  | typeof STORE_DAILY
  | typeof STORE_KEY_STATS
  | typeof STORE_ACHIEVEMENTS
  | typeof STORE_LESSON_PROGRESS;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_RESULTS)) {
        const store = db.createObjectStore(STORE_RESULTS, { keyPath: 'id' });
        // Sorting history by recency and filtering per mode are the two hot
        // queries on the statistics page.
        store.createIndex('completedAt', 'completedAt');
        store.createIndex('mode', 'mode');
        store.createIndex('sourceId', 'sourceId');
      }

      if (!db.objectStoreNames.contains(STORE_DAILY)) {
        // Keyed by `YYYY-MM-DD` for the activity heatmap.
        db.createObjectStore(STORE_DAILY, { keyPath: 'date' });
      }

      if (!db.objectStoreNames.contains(STORE_KEY_STATS)) {
        db.createObjectStore(STORE_KEY_STATS, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORE_ACHIEVEMENTS)) {
        db.createObjectStore(STORE_ACHIEVEMENTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_LESSON_PROGRESS)) {
        db.createObjectStore(STORE_LESSON_PROGRESS, { keyPath: 'lessonId' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      // Another tab requesting a version upgrade must not leave a stale handle.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function getDb(): Promise<IDBDatabase | null> {
  dbPromise ??= openDatabase();
  return dbPromise;
}

/** Wraps a request in a promise that resolves `null` on failure. */
function promisify<T>(request: IDBRequest<T>): Promise<T | null> {
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function put<T>(store: StoreName, value: T): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const tx = db.transaction(store, 'readonly');
    const result = await promisify<T[]>(tx.objectStore(store).getAll());
    return result ?? [];
  } catch {
    return [];
  }
}

export async function getByKey<T>(store: StoreName, key: IDBValidKey): Promise<T | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const tx = db.transaction(store, 'readonly');
    return await promisify<T>(tx.objectStore(store).get(key));
  } catch {
    return null;
  }
}

/**
 * Reads the most recent entries from an indexed store.
 *
 * Walks the index cursor in reverse rather than loading everything and sorting
 * in memory — history can reach thousands of rows and the statistics page only
 * ever renders a page of them.
 */
export async function getRecent<T>(
  store: StoreName,
  indexName: string,
  limit: number,
): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, 'readonly');
      const index = tx.objectStore(store).index(indexName);
      const request = index.openCursor(null, 'prev');
      const results: T[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor || results.length >= limit) {
          resolve(results);
          return;
        }
        results.push(cursor.value as T);
        cursor.continue();
      };

      request.onerror = () => resolve(results);
    } catch {
      resolve([]);
    }
  });
}

export async function count(store: StoreName): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const tx = db.transaction(store, 'readonly');
    return (await promisify<number>(tx.objectStore(store).count())) ?? 0;
  } catch {
    return 0;
  }
}

export async function clearStore(store: StoreName): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/** Erases every trace of the user's data — required by the privacy promise. */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    clearStore(STORE_RESULTS),
    clearStore(STORE_DAILY),
    clearStore(STORE_KEY_STATS),
    clearStore(STORE_ACHIEVEMENTS),
    clearStore(STORE_LESSON_PROGRESS),
  ]);
}
