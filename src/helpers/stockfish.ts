/**
 * Minimal Stockfish.js integration for testing
 * Provides engine initialization and continuation generation
 */

class StockfishEngine {
  private worker: Worker | null = null;
  private messageQueue: Set<(data: string) => void> = new Set();
  private isReady = false;
  private variant: { path: string; name: string; threads: number } | null = null;

  async init(): Promise<void> {
    if (this.worker) {
      console.debug("Engine already initialized");
      return;
    }

    console.debug("Initializing Stockfish engine...");

    return new Promise((resolve, reject) => {
      try {
        // Get the appropriate engine variant
        this.variant = getEngineVariant();

        console.debug(`Loading ${this.variant.name}`);
        console.debug(`Threads: ${this.variant.threads}`);

        // For Vite, we need to use the path directly without new URL
        this.worker = new Worker(this.variant.path, { type: "classic" });

        this.worker.onmessage = (e) => {
          const message = e.data;

          // Reduce console spam - only log important messages
          if (message === "readyok" || message === "uciok" || message.startsWith("bestmove")) {
            console.debug("Engine:", message);
          }

          // Notify all listeners
          this.messageQueue.forEach((callback) => callback(message));

          // Check if ready
          if (message === "readyok") {
            this.isReady = true;
            console.debug(`✅ ${this.variant!.name} engine ready!`);
            resolve();
          }

          if (message === "uciok") {
            console.log("✅ UCI protocol confirmed");
            // Configure threads if multi-threaded
            if (this.variant && this.variant.threads > 1) {
              // see https://official-stockfish.github.io/docs/stockfish-wiki/UCI-&-Commands.html#setoption
              this.send(`setoption name Threads value ${this.variant.threads}`);
              console.log(`⚙️ Configured ${this.variant.threads} threads`);
            }
            // Request ready status
            this.send("isready");
          }
        };

        this.worker.onerror = (err) => {
          console.error("Worker error:", err);
          reject(err);
        };

        // Initialize UCI protocol
        console.debug("Sending UCI command...");
        this.send("uci");
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

    // Only log important commands
    if (command === "uci" || command === "isready" || command.startsWith("setoption")) {
      console.debug("→ Sending:", command);
    }

    this.worker.postMessage(command);
  }

  /**
   * Get best continuation from a position
   * @param fen - Position FEN
   * @param numMoves - Number of moves to generate (continuation length)
   * @param depth - Search depth (default: 18)
   */
  async getContinuation(fen: string, numMoves: number, depth: number): Promise<string[]> {
    if (!this.worker || !this.isReady) {
      throw new Error("Engine not ready. Call init() first.");
    }

    console.log(`🔍 Analyzing position (${numMoves} moves, depth ${depth})...`);

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
            console.log(`✅ Analysis complete: ${moves.join(" ")}`);
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

  getEngineInfo(): { name: string; threads: number } | null {
    return this.variant;
  }

  terminate(): void {
    if (this.worker) {
      console.debug("Terminating engine...");
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.messageQueue = new Set();
      this.variant = null;
    }
  }
}

/**
 * Detect if the device is mobile
 */
function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
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
 */
function getEngineVariant(): { path: string; name: string; threads: number } {
  const isMobile = isMobileDevice();
  const hasCORS = isSharedArrayBufferAvailable();

  if (!isMobile && hasCORS) {
    // Desktop with CORS: Multi-threaded FULL engine (strongest)
    console.debug("🚀 Desktop with CORS: Multi-threaded FULL (75MB, strongest)");
    return {
      path: "/stockfish/stockfish-17.1-8e4d048.js",
      name: "Desktop Multi-threaded Full",
      threads: navigator.hardwareConcurrency || 4,
    };
  } else if (!isMobile && !hasCORS) {
    // Desktop without CORS: Single-threaded FULL engine
    console.debug("🚀 Desktop (no CORS): Single-threaded FULL (75MB, strong)");
    return {
      path: "/stockfish/stockfish-17.1-single-a496a04.js",
      name: "Desktop Single-threaded Full",
      threads: 1,
    };
  } else if (isMobile && hasCORS) {
    // Mobile with CORS: Multi-threaded LITE engine (battery-friendly)
    console.debug("📱 Mobile with CORS: Multi-threaded Lite (7MB)");
    return {
      path: "/stockfish/stockfish-17.1-lite-51f59da.js",
      name: "Mobile Multi-threaded Lite",
      threads: Math.min(navigator.hardwareConcurrency || 2, 2), // Max 2 threads on mobile
    };
  } else {
    // Mobile without CORS: Single-threaded LITE engine (most compatible)
    console.debug("📱 Mobile (no CORS): Single-threaded Lite (7MB)");
    return {
      path: "/stockfish/stockfish-17.1-lite-single-03e3232.js",
      name: "Mobile Single-threaded Lite",
      threads: 1,
    };
  }
}

/**
 * A customer wrapper API to use Stockfish engine to get continuation.
 */
export class Stockfish {
  static engineInstance: StockfishEngine | null = null;

  private static async engine() {
    if (!this.engineInstance) {
      this.engineInstance = new StockfishEngine();
      await this.engineInstance.init();
    }

    return this.engineInstance;
  }

  static terminate() {
    if (this.engineInstance) {
      this.engineInstance.terminate();
      this.engineInstance = null;
    }
  }

  static async getContinuation(fen: string, numMoves: number, depth: number): Promise<string[]> {
    const engine = await this.engine();
    return engine.getContinuation(fen, numMoves, depth);
  }
}
