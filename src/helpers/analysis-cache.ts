import type { Evaluation } from "chessops/pgn";

import { GameMove, type ParsedGame, type Variation } from "@/helpers/pgn";

type StoredMove = {
  ply: number;
  san: string;
  fen: string;
  from: string;
  to: string;
  uci: string;
  textComments: string[];
  evaluation?: Evaluation;
  nags?: number[];
  clock?: number;
  variations?: Variation[];
};

type StoredAnalysis = {
  gameId: string;
  depth: number;
  headers: ParsedGame["headers"];
  moves: StoredMove[];
  timestamp: number;
};

type AnalysisKey = {
  gameId: string;
  depth: number;
};

const DB_NAME = "hanging_piece_analysis";
const STORE_NAME = "analysis";
const DB_VERSION = 1;

export class AnalysisCache {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: ["gameId", "depth"] });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  static async store(key: AnalysisKey, game: ParsedGame): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const storedMoves: StoredMove[] = game.moves.map((move) => ({
        ply: move.ply,
        san: move.san,
        fen: move.fen,
        from: move.from,
        to: move.to,
        uci: move.uci,
        textComments: move.textComments,
        evaluation: move.evaluation,
        nags: move.nags,
        clock: move.clock,
        variations: move.variations,
      }));

      const record: StoredAnalysis = {
        gameId: key.gameId,
        depth: key.depth,
        headers: game.headers,
        moves: storedMoves,
        timestamp: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to store analysis in cache:", error);
    }
  }

  static async get(key: AnalysisKey): Promise<ParsedGame | null> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);

      const record = await new Promise<StoredAnalysis | undefined>((resolve, reject) => {
        const request = store.get([key.gameId, key.depth]);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!record) {
        return null;
      }

      const moves = record.moves.map((m) => new GameMove(m));

      return {
        headers: record.headers,
        moves,
      };
    } catch (error) {
      console.error("Failed to retrieve analysis from cache:", error);
      return null;
    }
  }

  static async clearAll(): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to clear analysis cache:", error);
      throw error;
    }
  }

  static async cleanOld(daysOld = 30): Promise<number> {
    try {
      const db = await this.initDB();
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
      console.error("Failed to clean old analysis:", error);
      return 0;
    }
  }
}
