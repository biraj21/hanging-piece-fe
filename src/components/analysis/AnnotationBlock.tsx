import React, { useState } from "react";

import { env } from "@/config/env";
import { INITIAL_FEN } from "@/constants";
import { getExplanation, storeExplanation } from "@/helpers/explanation-cache";
import type { GameMove, MoveQuality, Variation } from "@/helpers/pgn";
import { isMateEval } from "@/helpers/pgn";
import { Stockfish } from "@/helpers/stockfish";
import type { EngineLineMove } from "@/types";
import { parseUciContinuation } from "@/utils/chess";

import { MoveQualityIcon } from "./MoveQualityIcon";
import { TellMeWhyButton } from "./TellMeWhy";

type AnnotationBlockProps = {
  moveIndex: number;
  moves: GameMove[];
  gameId: string;
  opening?: string;
  eco?: string;
  isSimple?: boolean; // simple annotation without best line
  onShowExplanation?: (data: {
    move: GameMove;
    moveIndex: number;
    explanation: string;
    badContinuation: Array<{ move: string; color?: string; reason: string }>;
    bestContinuation: Array<{ move: string; color?: string; reason: string }>;
    badLine: Array<EngineLineMove>;
    bestLine: Array<EngineLineMove>;
  }) => void;
};

const getAnnotationClasses = (moveQuality: MoveQuality) => {
  switch (moveQuality) {
    case "blunder":
      return "bg-red-500/50 border border-red-500 text-red-100";
    case "mistake":
      return "bg-orange-500/50 border border-orange-500 text-orange-100";
    case "inaccuracy":
      return "bg-blue-500/50 border border-blue-500 text-blue-100";
    case "good":
      return "bg-emerald-500/50 border border-emerald-500 text-emerald-100";
    default:
      return "bg-neutral-700/50 border border-neutral-500 text-neutral-300";
  }
};

export const AnnotationBlock: React.FC<AnnotationBlockProps> = ({
  moveIndex,
  moves,
  gameId,
  opening,
  eco,
  isSimple = false,
  onShowExplanation,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const move = moves[moveIndex];
  const moveQuality = move.getQuality();
  const bestLine: Variation = move.variations?.[0] || [];
  const annotationText = move.textComments.join(" ").trim();
  const hasBestLine = bestLine.length > 0;

  const beforeFen = moveIndex === 0 ? INITIAL_FEN : moves[moveIndex - 1].fen;
  const moverColor = move.ply % 2 === 1 ? "w" : "b";

  const mateValue = () => {
    if (move.evaluation && isMateEval(move.evaluation)) {
      return move.evaluation.mate;
    }
    return 0;
  };

  const handleExplain = async () => {
    if (!hasBestLine) {
      setError("No best line available for this move.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to load from cache first
      const cached = await getExplanation({ gameId: gameId, moveIndex });
      if (cached) {
        // Check if we have visualization data (needed for clickable moves)
        const hasBadLine = cached.badLine && cached.badLine.length > 0;
        const hasBestLine = cached.bestLine && cached.bestLine.length > 0;

        if (hasBadLine && hasBestLine) {
          // Cache is complete, use it directly
          console.debug("✅ Using complete cached explanation with visualization data");
          onShowExplanation?.({
            move,
            moveIndex,
            explanation: cached.explanation,
            badContinuation: cached.badContinuation || [],
            bestContinuation: cached.bestContinuation || [],
            badLine: cached.badLine!, // Non-null assertion safe due to hasBadLine check
            bestLine: cached.bestLine!, // Non-null assertion safe due to hasBestLine check
          });
          setLoading(false);
          return;
        }

        // Cache is missing visualization data - need to regenerate lines
        console.debug("⚠️ Cached explanation missing visualization data, regenerating...");

        // Regenerate bad line
        const badUciMoves = await Stockfish.getContinuation(move.fen, 5, 18);
        const badContinuationParsed = parseUciContinuation(badUciMoves, move.fen);
        const badLineRegenerated = badContinuationParsed.slice(0, 8).map((item) => ({
          san: item.san,
          from: item.uci.substring(0, 2),
          to: item.uci.substring(2, 4),
          fen: item.afterFen,
        }));

        // Regenerate best line
        let bestLineRegenerated;
        const targetLength = 6;

        if (bestLine && bestLine.length >= targetLength) {
          bestLineRegenerated = bestLine.slice(0, targetLength).map((item) => ({
            san: item.san,
            from: item.from,
            to: item.to,
            fen: item.fen,
          }));
        } else if (hasBestLine) {
          const pgnMoves = bestLine.map((item) => ({
            san: item.san,
            from: item.from,
            to: item.to,
            fen: item.fen,
          }));
          const remaining = targetLength - bestLine.length;
          const lastMove = bestLine[bestLine.length - 1];
          const continuationUciMoves = await Stockfish.getContinuation(lastMove.fen, remaining, 18);
          const continuationParsed = parseUciContinuation(continuationUciMoves, lastMove.fen);
          const continuationFormatted = continuationParsed.map((item) => ({
            san: item.san,
            from: item.uci.substring(0, 2),
            to: item.uci.substring(2, 4),
            fen: item.afterFen,
          }));
          bestLineRegenerated = [...pgnMoves, ...continuationFormatted];
        } else {
          const bestUciMoves = await Stockfish.getContinuation(beforeFen, targetLength, 18);
          const bestContinuationParsed = parseUciContinuation(bestUciMoves, beforeFen);
          bestLineRegenerated = bestContinuationParsed.slice(0, 8).map((item) => ({
            san: item.san,
            from: item.uci.substring(0, 2),
            to: item.uci.substring(2, 4),
            fen: item.afterFen,
          }));
        }

        // Update cache with regenerated data
        await storeExplanation(
          { gameId: gameId, moveIndex },
          {
            explanation: cached.explanation,
            badContinuation: cached.badContinuation,
            bestContinuation: cached.bestContinuation,
            badLine: badLineRegenerated,
            bestLine: bestLineRegenerated,
          }
        );

        console.debug("✅ Regenerated visualization data and updated cache");

        // Use cached explanation with regenerated lines
        onShowExplanation?.({
          move,
          moveIndex,
          explanation: cached.explanation,
          badContinuation: cached.badContinuation || [],
          bestContinuation: cached.bestContinuation || [],
          badLine: badLineRegenerated,
          bestLine: bestLineRegenerated,
        });
        setLoading(false);
        return;
      }

      // Not in cache, fetch from API
      console.debug("🔍 Generating continuations...");

      // 1. Continuation after the BAD move (the move that was played)
      console.debug("  → Analyzing bad move:", move.san);
      const badUciMoves = await Stockfish.getContinuation(move.fen, 5, 18);
      const badContinuationParsed = parseUciContinuation(badUciMoves, move.fen);

      // 2. Best continuation - use PGN variation and supplement if needed
      let bestContinuationParsed: Array<{ san: string; uci: string; beforeFen: string; afterFen: string }>;
      const targetLength = 6;

      if (bestLine && bestLine.length >= targetLength) {
        console.debug("  → Using PGN best line (already has", bestLine.length, "moves)");
        // Convert PGN variation to the ContinuationMove format
        bestContinuationParsed = bestLine.slice(0, targetLength).map((move) => ({
          san: move.san,
          uci: move.uci,
          beforeFen: move.beforeFen,
          afterFen: move.fen,
        }));
      } else if (hasBestLine) {
        // Use PGN moves + generate remaining moves
        const pgnMoves = bestLine.map((move) => ({
          san: move.san,
          uci: move.uci,
          beforeFen: move.beforeFen,
          afterFen: move.fen,
        }));

        const remaining = targetLength - bestLine.length;
        console.debug(`  → Using ${bestLine.length} PGN moves + generating ${remaining} more moves`);

        // Continue from the last position in the PGN line
        const lastMove = bestLine[bestLine.length - 1];
        const continuationUciMoves = await Stockfish.getContinuation(lastMove.fen, remaining, 18);
        const continuationParsed = parseUciContinuation(continuationUciMoves, lastMove.fen);

        bestContinuationParsed = [...pgnMoves, ...continuationParsed];
      } else {
        console.debug("  → No PGN best line, generating all 6 moves from Stockfish");
        const bestUciMoves = await Stockfish.getContinuation(beforeFen, targetLength, 18);
        bestContinuationParsed = parseUciContinuation(bestUciMoves, beforeFen);
      }

      console.debug("✅ Bad continuation:", badContinuationParsed.map((m) => m.san).join(" "));
      console.debug("✅ Best continuation:", bestContinuationParsed.map((m) => m.san).join(" "));
      console.debug("   → Best move (first in continuation):", bestContinuationParsed[0]?.san);

      // Format continuations for backend
      const badContinuation = badContinuationParsed.map((item, idx) => {
        const color = idx % 2 === 0 ? moverColor : moverColor === "w" ? "b" : "w";
        return {
          pgn: item.san,
          before_fen: item.beforeFen,
          after_fen: item.afterFen,
          color,
        };
      });

      // Include the best move itself as the first element in bestContinuation
      const bestContinuation = bestContinuationParsed.map((item, idx) => {
        const color = idx % 2 === 0 ? moverColor : moverColor === "w" ? "b" : "w";
        return {
          pgn: item.san,
          before_fen: item.beforeFen,
          after_fen: item.afterFen,
          color,
        };
      });

      const body = {
        color: moverColor,
        moveQuality: moveQuality || undefined,
        mate: mateValue,
        move: {
          pgn: move.san,
          before_fen: beforeFen,
          after_fen: move.fen,
        },
        badContinuation,
        bestContinuation, // Now includes the best move as the first element
        opening: opening || undefined,
        eco: eco || undefined,
        additionalContext: annotationText || undefined,
      };

      console.debug("\n📤 Sending to backend:");
      console.debug("  Move played:", body.move.pgn, `(${moveQuality})`);
      console.debug("  Best move:", bestContinuation[0]?.pgn, "(first in best continuation)");
      console.debug("  Bad continuation:", badContinuation.map((c) => c.pgn).join(" "));
      console.debug("  Best continuation:", bestContinuation.map((c) => c.pgn).join(" "));
      console.debug("");

      const response = await fetch(`${env.VITE_API_BASE_URL}explain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch explanation");
      }

      const data = (await response.json()) as {
        explanation: string;
        badContinuation?: Array<{ move: string; color?: string; reason: string }>;
        bestContinuation?: Array<{ move: string; color?: string; reason: string }>;
      };

      // Format lines for storage and display
      const badLineFormatted = badContinuationParsed.slice(0, 8).map((item) => ({
        san: item.san,
        from: item.uci.substring(0, 2),
        to: item.uci.substring(2, 4),
        fen: item.afterFen,
      }));

      const bestLineFormatted = bestContinuationParsed.slice(0, 8).map((item) => ({
        san: item.san,
        from: item.uci.substring(0, 2),
        to: item.uci.substring(2, 4),
        fen: item.afterFen,
      }));

      // Store in cache for future use
      if (gameId) {
        await storeExplanation(
          { gameId: gameId, moveIndex },
          {
            explanation: data.explanation,
            badContinuation: data.badContinuation ?? [],
            bestContinuation: data.bestContinuation ?? [],
            badLine: badLineFormatted,
            bestLine: bestLineFormatted,
          }
        );
      }

      // Pass explanation to parent (use best continuation for arrows)
      onShowExplanation?.({
        move,
        moveIndex,
        explanation: data.explanation,
        badContinuation: data.badContinuation ?? [],
        bestContinuation: data.bestContinuation ?? [],
        badLine: badLineFormatted,
        bestLine: bestLineFormatted,
      });
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (isSimple) {
    return (
      <div className="mt-2 ml-8 p-2 rounded-lg text-sm leading-relaxed bg-neutral-700/50 border border-neutral-500 text-neutral-300">
        <div className="flex items-center gap-2">
          <span>{annotationText || "No comment"}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mt-2 ml-8 p-2 rounded-lg text-sm font-medium leading-relaxed ${getAnnotationClasses(moveQuality)}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <MoveQualityIcon moveQuality={moveQuality} size="small" />
          {moveQuality && moveQuality.charAt(0).toUpperCase() + moveQuality.slice(1)}.
          {bestLine && ` Best: ${bestLine.map((v) => v.san).join(" ")}`}
        </div>
        <div className="flex justify-end">
          <TellMeWhyButton onClick={handleExplain} disabled={!hasBestLine || loading} loading={loading} />
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-200">{error}</p>}
    </div>
  );
};
