import type { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { startingPosition, type Evaluation } from "chessops/pgn";
import { parseUci } from "chessops/util";

import { CONTINUATION_LENGTH, INITIAL_FEN, STOCKFISH_DEFAULT_DEPTH } from "@/constants";
import { StockfishAnalysis } from "@/db/stockfish-analysis";
import { getNagFromQuality } from "@/helpers/move-quality";
import type { MoveQuality, ParsedGame, Variation } from "@/helpers/pgn";
import { GameMove } from "@/helpers/pgn";
import { isCentipawnEval, isMateEval, Stockfish } from "@/helpers/stockfish";
import type { EngineEvaluation } from "@/types";
import { parseUciContinuation } from "@/utils/chess";

export type AnalysisProgress = {
  currentMoveIndex: number;
  totalMoves: number;
};

export type AnalysisCallbacks = {
  onProgress?: (progress: AnalysisProgress) => void;
};

/**
 * Analyze a game using Stockfish and assign NAGs (move quality annotations)
 * @param game - Parsed game without analysis
 * @param depth - Search depth
 * @param callbacks - Progress callbacks
 * @param gameId - Game identifier for caching
 * @returns New ParsedGame with evaluations and NAGs
 */
export async function analyzeGame(
  game: ParsedGame,
  depth: number = STOCKFISH_DEFAULT_DEPTH,
  callbacks: AnalysisCallbacks = {},
  engine?: Stockfish | null,
  gameId?: string,
): Promise<ParsedGame> {
  const { onProgress } = callbacks;

  if (gameId) {
    const cached = await StockfishAnalysis.findOne(gameId, depth);
    if (cached) {
      console.debug("Using cached analysis for", gameId, "at depth", depth);
      return cached;
    }
  }

  const startTime = performance.now();

  const isLocalEngine = !engine;
  if (!engine) {
    engine = Stockfish.create();
  }

  // Get starting position from game headers (handles FEN header if present)
  // startingPosition returns a Position directly, just clone it for mutation
  const position = startingPosition(game.headers).unwrap().clone();

  const analyzedMoves: GameMove[] = [];
  // Store evaluations normalized to WHITE's perspective
  // Stockfish returns eval from the perspective of the side to move!
  let previousEvalWhite: EngineEvaluation | null = null;

  // Map to store text comments by move index
  const textCommentsPerMove: Record<number, string[]> = {};

  // Get initial position FEN (white to move, so eval is from white's perspective)
  let currentFen = makeFen(position.toSetup());

  // Evaluate starting position
  try {
    const startEval = await engine.getEvaluation(currentFen, depth);
    // Starting position has white to move, so eval is already from white's perspective
    previousEvalWhite = startEval;
  } catch (err) {
    console.error("Failed to evaluate starting position:", err);
  }

  // Helper to convert eval to white's perspective based on side to move
  // Stockfish returns eval from the perspective of the side to move!
  const toWhitePerspective = (ev: EngineEvaluation, sideToMove: "white" | "black"): EngineEvaluation => {
    if (sideToMove === "white") {
      return ev; // Already from white's perspective
    }
    // Black to move - Stockfish returns from black's perspective, negate for white's
    if (isCentipawnEval(ev)) {
      return { cp: -ev.cp };
    }
    if (isMateEval(ev)) {
      // mate: 0 = black is checkmated (black to move but in checkmate)
      // From white's perspective, this is a WIN (white delivered checkmate)
      // We use mate: 1 to indicate "white wins" (positive mate = good for white)
      if (ev.mate === 0) {
        return { mate: 1 }; // White delivered checkmate - treat as winning
      }
      return { mate: -ev.mate };
    }
    return ev;
  };

  // Analyze each move
  for (let i = 0; i < game.moves.length; i++) {
    const move = game.moves[i];
    const moverColor = move.ply % 2 === 1 ? "white" : "black";

    // Report progress
    if (onProgress) {
      onProgress({
        currentMoveIndex: i,
        totalMoves: game.moves.length,
      });
    }

    // Parse and play the move
    const moveUci = parseUci(move.uci);
    if (!moveUci || !position.isLegal(moveUci)) {
      console.error(`Illegal move at index ${i}: ${move.san}`);
      // Skip this move but add it without analysis
      analyzedMoves.push(move);
      continue;
    }

    position.play(moveUci);
    const fenAfter = makeFen(position.toSetup());

    // After the move, it's the opponent's turn
    const sideToMoveAfter = moverColor === "white" ? "black" : "white";

    // Get evaluation after the move
    let evalAfterWhite: EngineEvaluation | null = null;
    try {
      const rawEval = await engine.getEvaluation(fenAfter, depth);
      // Convert to white's perspective
      evalAfterWhite = toWhitePerspective(rawEval, sideToMoveAfter);
    } catch (err) {
      console.error(`Failed to evaluate position after move ${i}:`, err);
    }

    // Calculate move quality if we have both evaluations (both in white's perspective)
    let nags: number[] | undefined = undefined;
    let variations: Variation[] | undefined = undefined;

    // Check if this move delivered checkmate (don't mark checkmates as blunders!)
    const isCheckmate = move.san.includes("#");

    if (previousEvalWhite && evalAfterWhite && !isCheckmate) {
      // Use Lichess-compatible classification
      // Both evals are from WHITE's perspective, classifyMoveLichess handles the rest
      const quality = classifyMoveLichess(previousEvalWhite, evalAfterWhite, moverColor);

      if (quality) {
        const nag = getNagFromQuality(quality);
        if (nag !== undefined) {
          nags = [nag];

          // Get best line for bad moves (blunder, mistake, inaccuracy)
          if (quality === "blunder" || quality === "mistake" || quality === "inaccuracy") {
            try {
              // Get best continuation from the position before the move
              const beforeFen = i === 0 ? INITIAL_FEN : game.moves[i - 1].fen;
              const bestUciMoves = await engine.getContinuation(beforeFen, CONTINUATION_LENGTH[quality], depth);

              // Only create variation if we got moves back
              if (bestUciMoves.length > 0) {
                const bestContinuation = parseUciContinuation(bestUciMoves, beforeFen);

                // Convert to Variation format
                const variation: Variation = bestContinuation.map((item) => ({
                  san: item.san,
                  fen: item.afterFen,
                  beforeFen: item.beforeFen,
                  from: item.uci.substring(0, 2),
                  to: item.uci.substring(2, 4),
                  uci: item.uci,
                }));

                variations = [variation];

                // Generate text comment in Lichess format
                const bestMove = bestContinuation[0];
                const comment = generateMoveComment(quality, previousEvalWhite, evalAfterWhite, bestMove.san);
                // Store comment to be used when creating the new GameMove
                if (!textCommentsPerMove[i]) {
                  textCommentsPerMove[i] = [];
                }
                textCommentsPerMove[i].push(comment);
              }
            } catch (err) {
              console.error(`Failed to get best line for move ${i}:`, err);
            }
          }
        }
      }
    }

    // Convert evalAfterWhite to Evaluation format for GameMove (already in white's perspective)
    let evaluation: Evaluation | undefined = undefined;
    if (evalAfterWhite) {
      if (isCentipawnEval(evalAfterWhite)) {
        evaluation = { pawns: evalAfterWhite.cp / 100 };
      } else if (isMateEval(evalAfterWhite)) {
        evaluation = { mate: evalAfterWhite.mate };
      }
    }

    // Create analyzed move with text comments
    const allTextComments = [...move.textComments, ...(textCommentsPerMove[i] || [])];
    analyzedMoves.push(
      new GameMove({
        ply: move.ply,
        san: move.san,
        fen: fenAfter,
        from: move.from,
        to: move.to,
        uci: move.uci,
        textComments: allTextComments,
        evaluation,
        nags,
        clock: move.clock,
        variations,
      }),
    );

    // Update for next iteration (keep in white's perspective)
    previousEvalWhite = evalAfterWhite;
    currentFen = fenAfter;
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  console.debug(`Analysis complete in ${(duration / 1000).toFixed(2)}s`);

  if (isLocalEngine) {
    engine.terminate();
  }

  const result: ParsedGame = {
    headers: game.headers,
    moves: analyzedMoves,
  };

  if (gameId) {
    StockfishAnalysis.create(gameId, depth, result).catch((err) => {
      console.error("Failed to store analysis in cache:", err);
    });
  }

  return result;
}

/**
 * Format evaluation for display in comments
 * @param ev - Evaluation (cp or mate)
 * @returns Formatted string like "10.68" or "Mate in 3"
 */
function formatEvaluation(ev: EngineEvaluation): string {
  if (isCentipawnEval(ev)) {
    const pawns = ev.cp / 100;
    return pawns.toFixed(2);
  } else if (isMateEval(ev)) {
    if (ev.mate === 0) {
      return "Mate";
    }
    return ev.mate > 0 ? `Mate in ${ev.mate}` : `Mate in ${-ev.mate}`;
  }
  return "0.00";
}

/**
 * Generate Lichess-style comment text for a move of poor quality
 * @param quality - Move quality classification
 * @param prevEval - Evaluation before the move (from white's perspective)
 * @param currEval - Evaluation after the move (from white's perspective)
 * @param bestMoveSan - Best move in SAN notation
 * @param position - Optional chess position to detect game termination
 * @returns Formatted comment text
 */
function generateMoveComment(
  quality: MoveQuality,
  prevEval: EngineEvaluation,
  currEval: EngineEvaluation,
  bestMoveSan: string,
  position?: Chess,
): string {
  // Format evaluations
  const prevEvalStr = formatEvaluation(prevEval);
  const currEvalStr = formatEvaluation(currEval);

  // Build comment base
  let comment = `(${prevEvalStr} → ${currEvalStr}) ${quality.charAt(0).toUpperCase() + quality.slice(1)}. ${bestMoveSan} was best.`;

  // Add termination info if position is provided
  if (position) {
    const outcome = position.outcome();

    if (outcome) {
      if (position.isStalemate()) {
        comment += " Draw by stalemate.";
      } else if (position.isInsufficientMaterial()) {
        comment += " Draw by insufficient material.";
      } else if (outcome.winner === "white") {
        comment += " White wins.";
      } else if (outcome.winner === "black") {
        comment += " Black wins.";
      }
    }
  }

  return comment;
}

// ============================================================================
// Lichess-compatible winning chances and move classification
// Based on: https://github.com/lichess-org/lila/blob/master/ui/lib/src/ceval/winningChances.ts
// and: https://github.com/lichess-org/lila/blob/master/modules/tree/src/main/Advice.scala
// ============================================================================

const MULTIPLIER = -0.00368208; // Lichess constant

/**
 * Calculate winning chances from centipawns (Lichess formula)
 * @param cp - Evaluation in centipawns (from WHITE's perspective)
 * @returns Winning chances in range [-1, +1] where +1 = white wins, -1 = black wins
 */
export function winningChances(cp: number): number {
  // Clamp to reasonable range to avoid extreme values
  const clamped = Math.max(-1000, Math.min(1000, cp));
  const result = 2 / (1 + Math.exp(MULTIPLIER * clamped)) - 1;
  return Math.max(-1, Math.min(1, result));
}

/**
 * Calculate winning chances from mate (Lichess formula)
 * Positive mate = can force mate = winning (+1 for the side with mate)
 * Negative mate = getting mated = losing (-1 for the side getting mated)
 * @param mate - Mate in N moves (positive = mover can force, negative = mover getting mated)
 * @returns Winning chances in range [-1, +1]
 */
export function winningChancesFromMate(mate: number): number {
  if (mate === 0) {
    return -1; // Already checkmated - this side lost
  }

  // Positive mate = +1 (winning), Negative mate = -1 (losing)
  return mate > 0 ? 1 : -1;
}

/**
 * Get winning chances from an evaluation (from the side-to-move's perspective)
 * @param ev - Evaluation with cp or mate
 * @returns Winning chances in [-1, +1] for the side to move
 */
export function getWinningChances(ev: EngineEvaluation): number {
  if (isMateEval(ev)) {
    return winningChancesFromMate(ev.mate);
  }

  return winningChances(ev.cp);
}

// Lichess thresholds for move classification (on [-1, +1] scale)
const THRESHOLDS = {
  blunder: 0.3,
  mistake: 0.2,
  inaccuracy: 0.1,
} as const;

/**
 * Classify a move using Lichess's exact algorithm
 *
 * @param prevCpWhite - Centipawns before the move (from WHITE's perspective)
 * @param currCpWhite - Centipawns after the move (from WHITE's perspective)
 * @param moverColor - The color of the player who made the move
 * @returns Move quality classification or null
 */
export function classifyMoveLichess(
  prevEval: EngineEvaluation,
  currEval: EngineEvaluation,
  moverColor: "white" | "black",
): MoveQuality | undefined {
  // Handle mate transitions first (Lichess MateAdvice logic)
  const mateClassification = classifyMateTransition(prevEval, currEval, moverColor);
  if (mateClassification) {
    return mateClassification;
  }

  // Both must have cp for standard classification
  if (!isCentipawnEval(prevEval) || !isCentipawnEval(currEval)) {
    return;
  }

  // Calculate winning chances (both from WHITE's perspective)
  const prevWinChances = winningChances(prevEval.cp);
  const currWinChances = winningChances(currEval.cp);

  // Delta = current - previous
  let delta = currWinChances - prevWinChances;

  // Flip sign for white's moves (Lichess: info.color.fold(-d, d))
  // After white moves, info.color is the mover = white, so we use -d
  if (moverColor === "white") {
    delta = -delta;
  }

  // Match against thresholds (highest first)
  if (delta >= THRESHOLDS.blunder) {
    return "blunder";
  } else if (delta >= THRESHOLDS.mistake) {
    return "mistake";
  } else if (delta >= THRESHOLDS.inaccuracy) {
    return "inaccuracy";
  }
}

// Keep old functions for backwards compatibility
export function cpToWinningChance(cp: number): number {
  return 50 + 50 * winningChances(cp);
}

export function calculateWinningChanceDelta(evalBefore: EngineEvaluation, evalAfter: EngineEvaluation): number {
  const before = getWinningChances(evalBefore);
  const after = getWinningChances(evalAfter);
  // Convert from [-1,+1] scale to [0,100] scale for backwards compat
  return Math.max(0, (before - after) * 50);
}

export function classifyMoveByDelta(delta: number): MoveQuality | undefined {
  // Convert from [0,100] scale to [0,1] scale for thresholds
  const normalized = delta / 50;
  if (normalized >= THRESHOLDS.blunder) {
    return "blunder";
  }
  if (normalized >= THRESHOLDS.mistake) {
    return "mistake";
  }
  if (normalized >= THRESHOLDS.inaccuracy) {
    return "inaccuracy";
  }
}

/**
 * Handle mate transitions (Lichess MateAdvice logic)
 *
 * MateCreated: Opponent got a forced mate (we blundered into mate)
 * MateLost: We had forced mate but now we don't
 */
export function classifyMateTransition(
  prevEval: EngineEvaluation,
  currEval: EngineEvaluation,
  moverColor: "white" | "black",
): MoveQuality | undefined {
  // Normalize to mover's perspective
  const invertIfBlack = (val: number) => (moverColor === "black" ? -val : val);

  const prevMate = isMateEval(prevEval) ? invertIfBlack(prevEval.mate) : undefined;
  const currMate = isMateEval(currEval) ? invertIfBlack(currEval.mate) : undefined;
  const prevCp = isCentipawnEval(prevEval) ? invertIfBlack(prevEval.cp) : 0;
  const currCp = isCentipawnEval(currEval) ? invertIfBlack(currEval.cp) : 0;

  // MateCreated: We didn't have mate threat, now opponent has forced mate on us
  if (prevMate === undefined && currMate !== undefined && currMate < 0) {
    // Severity based on how bad position was before
    if (prevCp < -999) {
      return "inaccuracy";
    }
    if (prevCp < -700) {
      return "mistake";
    }
    return "blunder";
  }

  // MateLost: We had forced mate, now we don't
  if (prevMate !== undefined && prevMate > 0) {
    if (currMate === undefined || currMate < 0) {
      // Severity based on resulting position
      if (currCp > 999) return "inaccuracy";
      if (currCp > 700) return "mistake";
      return "blunder";
    }
  }
}
