/**
 * IndexedDB cache for chess move explanations
 * Stores explanations by game hash + move index
 */

const DB_NAME = "hanging_piece_explanations";
const STORE_NAME = "explanations";
const DB_VERSION = 1;

import type { EngineLineMove } from "@/types";

type StoredExplanation = {
  gameId: string;
  moveIndex: number;
  explanation: string;
  badContinuation?: Array<{ move: string; color?: string; reason: string }>;
  bestContinuation?: Array<{ move: string; color?: string; reason: string }>;
  badLine?: EngineLineMove[];
  bestLine?: EngineLineMove[];
  timestamp: number;
};

type ExplanationKey = {
  gameId: string;
  moveIndex: number;
};

type ExplanationData = {
  explanation: string;
  badContinuation?: Array<{ move: string; color?: string; reason: string }>;
  bestContinuation?: Array<{ move: string; color?: string; reason: string }>;
  badLine?: EngineLineMove[];
  bestLine?: EngineLineMove[];
};

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize the IndexedDB database
 */
function initDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: ["gameHash", "moveIndex"] });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Store an explanation in the cache
 */
export async function storeExplanation(key: ExplanationKey, data: ExplanationData): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const record: StoredExplanation = {
      gameId: key.gameId,
      moveIndex: key.moveIndex,
      explanation: data.explanation,
      badContinuation: data.badContinuation,
      bestContinuation: data.bestContinuation,
      badLine: data.badLine,
      bestLine: data.bestLine,
      timestamp: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to store explanation in cache:", error);
    // Non-critical error, don't throw
  }
}

/**
 * Retrieve an explanation from the cache
 */
export async function getExplanation(key: ExplanationKey): Promise<ExplanationData | null> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const record = await new Promise<StoredExplanation | undefined>((resolve, reject) => {
      const request = store.get([key.gameId, key.moveIndex]);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!record) {
      return null;
    }

    return {
      explanation: record.explanation,
      badContinuation: record.badContinuation,
      bestContinuation: record.bestContinuation,
      badLine: record.badLine,
      bestLine: record.bestLine,
    };
  } catch (error) {
    console.error("Failed to retrieve explanation from cache:", error);
    return null;
  }
}

/**
 * Clear all cached explanations
 */
export async function clearAllExplanations(): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to clear explanation cache:", error);
    throw error;
  }
}

/**
 * Delete explanations older than specified days
 */
export async function cleanOldExplanations(daysOld = 30): Promise<number> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("timestamp");

    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const range = IDBKeyRange.upperBound(cutoffTime);

    let deletedCount = 0;

    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });

    return deletedCount;
  } catch (error) {
    console.error("Failed to clean old explanations:", error);
    return 0;
  }
}
