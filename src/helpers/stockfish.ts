import type { EngineCentipawnEval, EngineEvaluation, EngineMateEval } from "@/types";
import { isMobileDevice } from "@/utils/device";

export function isMateEval(ev: EngineEvaluation): ev is EngineMateEval {
  return "mate" in ev;
}

export function isCentipawnEval(ev: EngineEvaluation): ev is EngineCentipawnEval {
  return "cp" in ev;
}

const ALWAYS_SINGLE_LITE = true;

/**
 * Minimal Stockfish.js integration for testing
 * Provides engine initialization and continuation generation
 */

interface EngineVariant {
  path: string;
  variant: "lite" | "full";
  sizeMb: number;
  name: string;
  threads: number;
}

type EngineVariantKey = "LITE_MULTI" | "LITE_SINGLE" | "FULL_MULTI" | "FULL_SINGLE";

const STOCKFISH_ENGINE: Record<EngineVariantKey, EngineVariant> = {
  LITE_MULTI: {
    path: "/stockfish/stockfish-17.1-lite-51f59da.js",
    variant: "lite",
    sizeMb: 7,
    name: "Multi-threaded Lite",
    threads: Math.min(navigator.hardwareConcurrency || 2, 4),
  },
  LITE_SINGLE: {
    path: "/stockfish/stockfish-17.1-lite-single-03e3232.js",
    variant: "lite",
    sizeMb: 7,
    name: "Single-threaded Lite",
    threads: 1,
  },
  FULL_MULTI: {
    path: "/stockfish/stockfish-17.1-8e4d048.js",
    variant: "full",
    sizeMb: 75,
    name: "Multi-threaded Full",
    threads: navigator.hardwareConcurrency || 4,
  },
  FULL_SINGLE: {
    path: "/stockfish/stockfish-17.1-single-a496a04.js",
    variant: "full",
    sizeMb: 75,
    name: "Single-threaded Full",
    threads: 1,
  },
};

class StockfishEngine {
  private worker: Worker | null = null;
  private messageQueue: Set<(data: string) => void> = new Set();
  private uciSent = false;
  private isReady = false;
  private variant: EngineVariant | null = null;

  async init(variant: EngineVariant, hashMemoryMb?: number): Promise<void> {
    if (this.worker) {
      console.debug("Engine already initialized");
      return;
    }

    console.debug("Initializing Stockfish engine...");

    return new Promise((resolve, reject) => {
      try {
        // Get the appropriate engine variant
        this.variant = variant;

        console.debug(`Loading ${variant.name}`);
        console.debug(`Threads: ${variant.threads}`);

        this.worker = new Worker(variant.path);

        const handleMsgLine = (msg: string) => {
          // Notify all listeners
          this.messageQueue.forEach((callback) => callback(msg));

          // Check if ready
          if (msg === "readyok") {
            this.isReady = true;
            console.debug(`✅ ${variant.name} engine ready!`);
            resolve();
            return;
          }

          if (msg === "uciok") {
            console.debug("✅ UCI protocol confirmed");
            // Configure threads if multi-threaded
            if (variant.threads > 1) {
              // see https://official-stockfish.github.io/docs/stockfish-wiki/UCI-&-Commands.html#setoption
              this.send(`setoption name Threads value ${variant.threads}`);

              console.debug(`⚙️ Configured ${variant.threads} threads`);
            }

            console.log("birajlog threads", variant.threads, { hashMemoryMb });
            if (hashMemoryMb) {
              console.log("birajlog memory", hashMemoryMb);
              this.send(`setoption name Hash value ${hashMemoryMb || 16}`);
            }

            // Request ready status
            this.send("isready");
            return;
          }
        };

        this.worker.onmessage = (e) => {
          if (!this.uciSent) {
            // Initialize UCI protocol
            console.debug("Sending UCI command...");
            this.send("uci");
            this.uciSent = true;
          }

          const lines = String(e.data).split("\n");
          lines.forEach((line) => handleMsgLine(line.trim()));
        };

        this.worker.onmessageerror = (e) => {
          console.error("Stockfish worker message error:", e);
        };

        this.worker.onerror = (err) => {
          console.error("Worker error:", err);
          reject(err);
        };
      } catch (err) {
        console.error("Failed to load Stockfish:", err);
        reject(err);
      }
    });
  }

  private send(command: string): void {
    if (!this.worker) {
      throw new Error("Engine not initialized");
    }

    this.worker.postMessage(command);
  }

  /**
   * Get evaluation from a position
   * @param fen - Position FEN
   * @param depth - Search depth
   * @returns Evaluation in centipawns or mate-in-N
   */
  async getEvaluation(fen: string, depth: number): Promise<EngineEvaluation> {
    if (!this.worker || !this.isReady) {
      throw new Error("Engine not ready. Call init() first.");
    }

    return new Promise((resolve, reject) => {
      let bestScore: EngineEvaluation | null = null;

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Engine timeout"));
      }, 30_000); // 30s timeout

      const handleMessage = (message: string) => {
        // Parse info lines: "info depth X score cp Y" or "info depth X score mate Z"
        if (message.startsWith("info")) {
          // Extract score (cp or mate)
          const cpMatch = message.match(/score\s+cp\s+(-?\d+)/);
          const mateMatch = message.match(/score\s+mate\s+(-?\d+)/);

          if (cpMatch) {
            bestScore = { cp: parseInt(cpMatch[1], 10) };
          } else if (mateMatch) {
            bestScore = { mate: parseInt(mateMatch[1], 10) };
          }
        }

        // When we get bestmove, we're done
        if (message.startsWith("bestmove")) {
          clearTimeout(timeout);
          cleanup();
          if (bestScore) {
            resolve(bestScore);
          } else if (message.includes("(none)")) {
            // Position is checkmate or stalemate - return mate 0 (already mated)
            resolve({ mate: 0 });
          } else {
            reject(new Error("No evaluation found"));
          }
        }
      };

      const cleanup = () => {
        this.messageQueue.delete(handleMessage);
      };

      // Add message handler
      this.messageQueue.add(handleMessage);

      // Set position and start analysis
      this.send(`position fen ${fen}`);
      this.send(`go depth ${depth}`);
    });
  }

  /**
   * Get best continuation from a position
   * @param fen - Position FEN
   * @param numMoves - Number of moves to generate (continuation length)
   * @param depth - Search depth
   */
  async getContinuation(fen: string, numMoves: number, depth: number): Promise<string[]> {
    if (!this.worker || !this.isReady) {
      throw new Error("Engine not ready. Call init() first.");
    }

    return new Promise((resolve, reject) => {
      const moves: string[] = [];
      let moveCount = 0;

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Engine timeout"));
      }, 30_000); // 30s timeout

      const handleMessage = (message: string) => {
        if (!message.startsWith("bestmove")) {
          return;
        }

        // Handle "bestmove (none)" - no legal moves (checkmate/stalemate)
        if (message.includes("(none)")) {
          clearTimeout(timeout);
          cleanup();
          resolve(moves);
          return;
        }

        // Parse best move from engine
        const match = message.match(/bestmove\s+(\w+)/);
        if (match) {
          const move = match[1];
          moves.push(move);
          moveCount++;

          if (moveCount >= numMoves) {
            // Done!
            clearTimeout(timeout);
            cleanup();
            resolve(moves);
          } else {
            // Make the move and continue
            this.send(`position fen ${fen} moves ${moves.join(" ")}`);
            this.send(`go depth ${depth}`);
          }
        }
      };

      const cleanup = () => {
        this.messageQueue.delete(handleMessage);
      };

      // Add message handler
      this.messageQueue.add(handleMessage);

      // Start analysis
      // see https://official-stockfish.github.io/docs/stockfish-wiki/UCI-&-Commands.html#position
      this.send(`position fen ${fen}`);

      // see https://official-stockfish.github.io/docs/stockfish-wiki/UCI-&-Commands.html#go
      this.send(`go depth ${depth}`);
    });
  }

  getEngineVariant(): EngineVariant | null {
    return this.variant;
  }

  terminate(): void {
    if (this.worker) {
      console.debug("Terminating engine...");
      this.worker.terminate();
      this.worker = null;
      this.uciSent = false;
      this.isReady = false;
      this.messageQueue = new Set();
      this.variant = null;
    }
  }
}

/**
 * Check if SharedArrayBuffer is available (required for multi-threaded engine)
 * This requires proper CORS headers: Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy
 */
function isSharedArrayBufferAvailable(): boolean {
  return typeof SharedArrayBuffer !== "undefined";
}

/**
 * Get the appropriate Stockfish variant based on device and capabilities
 * Files are served from public/stockfish/ folder
 *
 * Desktop = Full engine (75MB, strongest)
 * Mobile = Lite engine (7MB, fast & battery-friendly)
 * @param useLite - Force Lite engine (for full-game analysis)
 */
function getEngineVariant(useLite: boolean = false): EngineVariant {
  const hasCORS = isSharedArrayBufferAvailable();
  if (hasCORS) {
    return useLite ? STOCKFISH_ENGINE.LITE_MULTI : STOCKFISH_ENGINE.FULL_MULTI;
  } else {
    return useLite ? STOCKFISH_ENGINE.LITE_SINGLE : STOCKFISH_ENGINE.FULL_SINGLE;
  }
}

/**
 * Instance-based Stockfish wrapper that retains engine variant.
 * Create instances using static factory methods:
 * - Stockfish.createLite() - Fast, battery-friendly (for full-game analysis)
 * - Stockfish.createFull() - Strongest engine (for single-position analysis)
 */
export class Stockfish {
  private engine: StockfishEngine;
  private initPromise: Promise<void>;

  private constructor(variant: EngineVariant, hashMemoryMb?: number) {
    this.engine = new StockfishEngine();
    this.initPromise = this.engine.init(variant, hashMemoryMb);
  }

  /**
   * Create a Stockfish instance based on the device
   *
   * - Desktop: Full engine (75MB, strongest)
   * - Mobile: Lite engine (7MB, fast & battery-friendly)
   */
  static create(): Stockfish {
    const isMobile = isMobileDevice();
    const hashMemoryMb = isMobile ? 4 : 16;

    if (ALWAYS_SINGLE_LITE) {
      return new Stockfish(STOCKFISH_ENGINE.LITE_SINGLE, hashMemoryMb);
    }

    if (isMobile) {
      return this.createLite();
    } else {
      return this.createFull();
    }
  }

  /**
   * Create a Lite engine instance (fast, battery-friendly, 7MB)
   * Best for full-game analysis where speed matters
   */
  private static createLite(): Stockfish {
    const variant = getEngineVariant(true);
    return new Stockfish(variant);
  }

  /**
   * Create a Full engine instance (strongest, 75MB)
   * Best for single-position deep analysis
   */
  private static createFull(): Stockfish {
    const variant = getEngineVariant(false);
    return new Stockfish(variant);
  }

  /**
   * Ensure engine is initialized before use
   */
  private async ensureReady(): Promise<void> {
    await this.initPromise;
  }

  /**
   * Get evaluation from a position
   */
  async getEvaluation(fen: string, depth: number): Promise<EngineEvaluation> {
    await this.ensureReady();
    return this.engine.getEvaluation(fen, depth);
  }

  /**
   * Get best continuation from a position
   */
  async getContinuation(fen: string, numMoves: number, depth: number): Promise<string[]> {
    await this.ensureReady();
    return this.engine.getContinuation(fen, numMoves, depth);
  }

  /**
   * Terminate the engine and free resources
   */
  terminate(): void {
    this.engine.terminate();
  }
}
