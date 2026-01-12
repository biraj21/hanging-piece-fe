import { parseFen } from "chessops/fen";

import { backendApi, type ExplainMovePayload } from "@/api/backend";
import { CONTINUATION_LENGTH, INITIAL_FEN, STOCKFISH_DEFAULT_DEPTH } from "@/constants";
import type { BlackOrWhite, EngineEvaluation, Explanation } from "@/types";
import { parseUciContinuation, type ContinuationMove } from "@/utils/chess";

import { ExplanationCache } from "./explanation-cache";
import { isMateEval, isPawnsEval, type GameMove } from "./pgn";
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
  depth?: number;
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
  depth = STOCKFISH_DEFAULT_DEPTH,
}: ExplainOptions): Promise<Explanation> {
  if (moveIndex < 0 || moveIndex >= moves.length) {
    throw new Error("Invalid move index.");
  }

  console.log("birajlog depth", depth);

  const move = moves[moveIndex];
  const bestLine = move.variations?.[0];
  if (!bestLine || bestLine.length === 0) {
    throw new Error("No best line available for this move.");
  }

  const beforeFen = moveIndex === 0 ? INITIAL_FEN : moves[moveIndex - 1].fen;
  const color: BlackOrWhite = move.ply % 2 === 1 ? "white" : "black";

  // Try to load from cache first
  const cached = await ExplanationCache.get({ gameId, moveIndex });
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

  const moveQuality = move.getQuality();
  const numMoves = moveQuality ? CONTINUATION_LENGTH[moveQuality] : 5;

  const badUciMoves = await engine.getContinuation(move.fen, numMoves, depth);
  const badContinuationParsed = parseUciContinuation(badUciMoves, move.fen);

  // 2. Best continuation - use PGN variation and supplement if needed
  let bestContinuationParsed: ContinuationMove[];
  const targetLength = numMoves;

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
    const continuationUciMoves = await engine.getContinuation(lastMove.fen, remaining, depth);
    const continuationParsed = parseUciContinuation(continuationUciMoves, lastMove.fen);

    bestContinuationParsed = [...pgnMoves, ...continuationParsed];
  } else {
    const bestUciMoves = await engine.getContinuation(beforeFen, targetLength, depth);
    bestContinuationParsed = parseUciContinuation(bestUciMoves, beforeFen);
  }

  // Calculate evaluations for each position in the continuations
  const badLineWithEvals = await getContinuationWithEvaluations(engine, badContinuationParsed, depth);
  const bestLineWithEvals = await getContinuationWithEvaluations(engine, bestContinuationParsed, depth);

  // Format continuations for backend

  // invert color for continuation since it starts from opponent's move
  const badContinuation = formatContinuation(badLineWithEvals, color === "white" ? "black" : "white");

  // keep color as the mover for best continuation since it starts from the mover's best move
  const bestContinuation = formatContinuation(bestLineWithEvals, color);

  let moveEval: EngineEvaluation | undefined;
  if (move.evaluation && isPawnsEval(move.evaluation)) {
    moveEval = normalizeToWhitePerspective({ cp: move.evaluation.pawns * 100 }, move.fen);
  } else if (move.evaluation && isMateEval(move.evaluation)) {
    moveEval = normalizeToWhitePerspective(move.evaluation, move.fen);
  }

  const body: ExplainMovePayload = {
    move: {
      san: move.san,
      uci: move.uci,
      color: color,
      beforeFen: beforeFen,
      afterFen: move.fen,
      evaluation: moveEval,
    },
    moveQuality: move.getQuality(),
    userColor: userColor,
    badContinuation,
    bestContinuation,
    opening,
    eco,
    additionalContext: annotationText,
  };

  const data = await backendApi.explainMove(body);

  const explanation: Explanation = {
    explanation: data.explanation,
    badContinuation: data.badContinuation,
    bestContinuation: data.bestContinuation,
    badLine: badLineWithEvals.map((m) => ({
      san: m.san,
      from: m.uci.substring(0, 2),
      to: m.uci.substring(2, 4),
      fen: m.afterFen,
      evaluation: m.evaluation,
    })),
    bestLine: bestLineWithEvals.map((m) => ({
      san: m.san,
      from: m.uci.substring(0, 2),
      to: m.uci.substring(2, 4),
      fen: m.afterFen,
      evaluation: m.evaluation,
    })),
  };

  // Store in cache for future use
  ExplanationCache.store({ gameId, moveIndex }, explanation).catch((err) => {
    console.error("Failed to store explanation in cache:", err);
  });

  return explanation;
}

function formatContinuation<T extends ContinuationMove>(continuation: T[], firstMoveColor: BlackOrWhite) {
  const secondMoveColor: BlackOrWhite = firstMoveColor === "white" ? "black" : "white";
  return continuation.map((item, idx) => {
    const color: BlackOrWhite = idx % 2 === 0 ? firstMoveColor : secondMoveColor;
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

async function getContinuationWithEvaluations(engine: Stockfish, moves: ContinuationMove[], depth: number) {
  const continuation: Array<ContinuationMove & { evaluation?: EngineEvaluation }> = [];
  for (const move of moves) {
    let ev: EngineEvaluation | undefined;
    try {
      ev = await engine.getEvaluation(move.afterFen, depth);
      ev = normalizeToWhitePerspective(ev, move.afterFen);
    } catch (err) {
      console.error("Failed to evaluate move:", move, err);
    }

    continuation.push({
      ...move,
      // from: move.uci.substring(0, 2),
      // to: move.uci.substring(2, 4),
      evaluation: ev,
    });
  }

  return continuation;
}
