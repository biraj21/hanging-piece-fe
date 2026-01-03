import type { Evaluation } from "chessops/pgn";
import React from "react";

import { isMateEval } from "@/helpers/pgn";
import type { BlackOrWhite } from "@/types";

interface EvalBarProps {
  evaluation: Evaluation;
  className?: string;
  orientation?: BlackOrWhite;
}

/**
 * Converts pawn evaluation to a percentage for the eval bar.
 * Uses a sigmoid-like curve to compress extreme evaluations smoothly.
 * @param pawns - Evaluation in pawns (e.g., 2.5 means white is up 2.5 pawns)
 * @returns Percentage from 0-100 where 50 is equal, 100 is white winning, 0 is black winning
 */
function evalToPercentage(pawns: number): number {
  return 100 / (1 + Math.pow(10, -pawns / 4));
}

export const EvalBar: React.FC<EvalBarProps> = ({ evaluation, className = "", orientation = "white" }) => {
  let whitePercentage = 50;
  let evalText = "0.0";
  let isMate = false;

  if (isMateEval(evaluation)) {
    // Mate evaluation
    isMate = true;
    const mateIn = evaluation.mate;

    if (mateIn > 0) {
      // White is mating
      whitePercentage = 100;
      evalText = `M${mateIn}`;
    } else {
      // Black is mating
      whitePercentage = 0;
      evalText = `M${Math.abs(mateIn)}`;
    }
  } else if ("pawns" in evaluation) {
    // Pawns evaluation (already in pawns, not centipawns)
    const pawns = evaluation.pawns;
    whitePercentage = evalToPercentage(pawns);

    // Format the display text
    if (Math.abs(pawns) > 0) {
      evalText = pawns > 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2);
    } else {
      evalText = "0.0";
    }
  }

  const blackPercentage = 100 - whitePercentage;

  // When viewing from black's perspective, flip the bar
  const topPercentage = orientation === "white" ? blackPercentage : whitePercentage;
  const bottomPercentage = orientation === "white" ? whitePercentage : blackPercentage;
  const topColor = orientation === "white" ? "black" : "white";
  const bottomColor = orientation === "white" ? "white" : "black";

  return (
    <div className={`relative flex flex-col h-full w-8 ${className}`}>
      {/* Top section */}
      <div
        className={`transition-all duration-300 ease-out flex items-end justify-center ${
          topColor === "black" ? "bg-neutral-900" : "bg-neutral-50"
        }`}
        style={{ height: `${topPercentage}%` }}
      >
        {topPercentage > 70 && isMate && (
          <div className={`text-[9px] font-semibold pb-1 ${topColor === "black" ? "text-white" : "text-neutral-900"}`}>
            {evalText}
          </div>
        )}
      </div>

      {/* Evaluation text in the middle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-full text-center bg-neutral-950/80 py-0.5 text-[9px] font-semibold text-white whitespace-nowrap shadow-md">
        {evalText}
      </div>

      {/* Bottom section */}
      <div
        className={`transition-all duration-300 ease-out flex items-start justify-center ${
          bottomColor === "black" ? "bg-neutral-900" : "bg-neutral-50"
        }`}
        style={{ height: `${bottomPercentage}%` }}
      >
        {bottomPercentage > 70 && isMate && (
          <div
            className={`text-[9px] font-semibold pt-1 ${bottomColor === "black" ? "text-white" : "text-neutral-900"}`}
          >
            {evalText}
          </div>
        )}
      </div>
    </div>
  );
};
