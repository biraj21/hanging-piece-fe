import { parseFen } from "chessops/fen";

import { backendApi, type ExplainMovePayload } from "@/api/backend";
import { INITIAL_FEN, STOCKFISH_DEFAULT_DEPTH } from "@/constants";
import type { BlackOrWhite, EngineEvaluation, EngineMove, Explanation } from "@/types";
import { parseUciContinuation, type ContinuationMove } from "@/utils/chess";

import { ExplanationCache } from "./explanation-cache";
import { isMateEval, type GameMove } from "./pgn";
import { isCentipawnEval, Stockfish } from "./stockfish";

interface ExplainOptions {
  gameId: string;
  moves: GameMove[];
  moveIndex: number;
  userColor?: BlackOrWhite;
  opening?: string;
  eco?: string;
  annotationText?: string;
  engine?: Stockfish | null;
}

let cachedEngine: Stockfish | undefined;

export async function explain({
  gameId,
  moves,
  moveIndex,
  userColor,
  opening,
  eco,
  annotationText,
  engine,
}: ExplainOptions): Promise<Explanation> {
  if (moveIndex < 0 || moveIndex >= moves.length) {
    throw new Error("Invalid move index.");
  }

  const move = moves[moveIndex];
  const bestLine = move.variations?.[0];
  if (!bestLine || bestLine.length === 0) {
    throw new Error("No best line available for this move.");
  }

  const beforeFen = moveIndex === 0 ? INITIAL_FEN : moves[moveIndex - 1].fen;
  const color: BlackOrWhite = move.ply % 2 === 1 ? "white" : "black";

  const mateValue = () => {
    if (move.evaluation && isMateEval(move.evaluation)) {
      return move.evaluation.mate;
    }

    return 0;
  };

  // Try to load from cache first
  const cached = await ExplanationCache.get({ gameId: gameId, moveIndex });
  if (cached) {
    return cached;
  }

  // Not in cache, fetch from API
  console.debug("🔍 Generating continuations...");

  // Create Full engine instance for deep, accurate analysis
  if (!engine) {
    if (!cachedEngine) {
      cachedEngine = Stockfish.create();
    }

    engine = cachedEngine;
  }

  // 1. Continuation after the BAD move (the move that was played)
  console.debug("  → Analyzing bad move:", move.san);
  const badUciMoves = await engine.getContinuation(move.fen, 5, STOCKFISH_DEFAULT_DEPTH);
  const badContinuationParsed = parseUciContinuation(badUciMoves, move.fen);

  // 2. Best continuation - use PGN variation and supplement if needed
  let bestContinuationParsed: ContinuationMove[];
  const targetLength = 6;

  if (bestLine.length >= targetLength) {
    // Convert PGN variation to the ContinuationMove format
    bestContinuationParsed = bestLine.slice(0, targetLength).map((move) => ({
      san: move.san,
      uci: move.uci,
      beforeFen: move.beforeFen,
      afterFen: move.fen,
    }));
  } else if (bestLine.length > 0) {
    // Use PGN moves + generate remaining moves
    const pgnMoves = bestLine.map((move) => ({
      san: move.san,
      uci: move.uci,
      beforeFen: move.beforeFen,
      afterFen: move.fen,
    }));

    const remaining = targetLength - bestLine.length;

    // Continue from the last position in the PGN line
    const lastMove = bestLine[bestLine.length - 1];
    const continuationUciMoves = await engine.getContinuation(lastMove.fen, remaining, STOCKFISH_DEFAULT_DEPTH);
    const continuationParsed = parseUciContinuation(continuationUciMoves, lastMove.fen);

    bestContinuationParsed = [...pgnMoves, ...continuationParsed];
  } else {
    const bestUciMoves = await engine.getContinuation(beforeFen, targetLength, STOCKFISH_DEFAULT_DEPTH);
    bestContinuationParsed = parseUciContinuation(bestUciMoves, beforeFen);
  }

  // Format continuations for backend
  const badContinuation = formatContinuation(badContinuationParsed, color);
  const bestContinuation = formatContinuation(bestContinuationParsed, color);

  const body: ExplainMovePayload = {
    color: color,
    userColor: userColor,
    move: {
      san: move.san,
      beforeFen: beforeFen,
      afterFen: move.fen,
    },
    moveQuality: move.getQuality(),
    mate: mateValue(),
    badContinuation,
    bestContinuation,
    opening,
    eco,
    additionalContext: annotationText,
  };

  const data = await backendApi.explainMove(body);

  // Calculate evaluations for each position in the continuations
  const badLineFormatted: EngineMove[] = await getContinuationWithEvaluations(engine, badContinuationParsed);
  const bestLineFormatted: EngineMove[] = await getContinuationWithEvaluations(engine, bestContinuationParsed);

  const explanation: Explanation = {
    explanation: data.explanation,
    badContinuation: data.badContinuation,
    bestContinuation: data.bestContinuation,
    badLine: badLineFormatted,
    bestLine: bestLineFormatted,
  };

  // Store in cache for future use
  ExplanationCache.store({ gameId: gameId, moveIndex }, explanation).catch((err) => {
    console.error("Failed to store explanation in cache:", err);
  });

  return explanation;
}

function formatContinuation(continuation: ContinuationMove[], moverColor: BlackOrWhite) {
  return continuation.map((item, idx) => {
    const color: BlackOrWhite = idx % 2 === 0 ? moverColor : moverColor === "white" ? "black" : "white";
    return {
      ...item,
      color,
    };
  });
}

// Helper to normalize evaluation to White's perspective
// Stockfish returns eval from side-to-move's perspective
function normalizeToWhitePerspective(ev: EngineEvaluation, fen: string): EngineEvaluation {
  // Determine whose turn it is from FEN
  const { turn } = parseFen(fen).unwrap();
  if (turn === "white") {
    return ev; // already from white's perspective
  }

  // black to move - negate for white's perspective
  if (isCentipawnEval(ev)) {
    return { cp: -ev.cp };
  }

  if (isMateEval(ev)) {
    if (ev.mate === 0) {
      return { mate: 1 }; // Black is mated, White wins
    }

    return { mate: -ev.mate };
  }
  return ev;
}

async function getContinuationWithEvaluations(engine: Stockfish, moves: ContinuationMove[]) {
  const continuation: EngineMove[] = [];
  for (const move of moves) {
    let ev: EngineEvaluation | undefined;
    try {
      ev = await engine.getEvaluation(move.afterFen, STOCKFISH_DEFAULT_DEPTH);
      ev = normalizeToWhitePerspective(ev, move.afterFen);
    } catch (err) {
      console.error("Failed to evaluate move:", move, err);
    }

    continuation.push({
      san: move.san,
      from: move.uci.substring(0, 2),
      to: move.uci.substring(2, 4),
      fen: move.afterFen,
      evaluation: ev,
    });
  }

  return continuation;
}
