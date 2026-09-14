import type {
  EngineCentipawnEval,
  EngineEvaluation,
  EngineMateEval,
} from "@/types";

export function isMateEval(ev: EngineEvaluation): ev is EngineMateEval {
  return "mate" in ev;
}

export function isCentipawnEval(
  ev: EngineEvaluation,
): ev is EngineCentipawnEval {
  return "cp" in ev;
}

const STOCKFISH_PATH = "/stockfish/stockfish-18-lite-single.js";

class StockfishEngine {
  private worker: Worker | null = null;
  private messageQueue: Set<(data: string) => void> = new Set();
  private uciSent = false;
  private isReady = false;
  async init(): Promise<void> {
    if (this.worker) {
      console.debug("Engine already initialized");
      return;
    }

    console.debug("Initializing Stockfish engine...");

    return new Promise((resolve, reject) => {
      try {
        console.debug("Loading Stockfish 18 lite (single-threaded)");
        this.worker = new Worker(STOCKFISH_PATH);

        const handleMsgLine = (msg: string) => {
          // Notify all listeners
          this.messageQueue.forEach((callback) => callback(msg));

          // Check if ready
          if (msg === "readyok") {
            this.isReady = true;
            console.debug("✅ Stockfish engine ready!");
            resolve();
            return;
          }

          if (msg === "uciok") {
            console.debug("✅ UCI protocol confirmed");
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
  async getContinuation(
    fen: string,
    numMoves: number,
    depth: number,
  ): Promise<string[]> {
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

  terminate(): void {
    if (this.worker) {
      console.debug("Terminating engine...");
      this.worker.terminate();
      this.worker = null;
      this.uciSent = false;
      this.isReady = false;
      this.messageQueue = new Set();
    }
  }
}

/**
 * Stockfish wrapper using the single-threaded lite engine.
 */
export class Stockfish {
  private engine: StockfishEngine;
  private initPromise: Promise<void>;

  private constructor() {
    this.engine = new StockfishEngine();
    this.initPromise = this.engine.init();
  }

  /**
   * Create a Stockfish instance.
   */
  static create(): Stockfish {
    return new Stockfish();
  }

  /**
   * Ensure engine is initialized before use
   */
  async ensureReady(): Promise<void> {
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
  async getContinuation(
    fen: string,
    numMoves: number,
    depth: number,
  ): Promise<string[]> {
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
