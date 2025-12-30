import React from "react";

import { ChessPiece } from "@/components/ChessBoard/ChessPiece";
import type { GameMove, MoveQuality } from "@/helpers/pgn";
import { isPawnsEval } from "@/helpers/pgn";
import { MoveQualityIcon } from "./MoveQualityIcon";

type Props = {
  move: GameMove;
  index: number;
  isSelected: boolean;
  onClick: (index: number) => void;
  className?: string;
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
      return "bg-neutral-800 text-neutral-200 border border-neutral-700";
  }
};

const formatEval = (move: GameMove) => {
  if (!move.evaluation) {
    return null;
  }

  if (isPawnsEval(move.evaluation)) {
    return `${move.evaluation.pawns > 0 ? "+" : ""}${move.evaluation.pawns.toFixed(2)}`;
  }

  return `#${move.evaluation.mate}`;
};

const getEvalTextColor = (isSelected: boolean) => (isSelected ? "text-white" : "text-neutral-300");

export const MoveItem: React.FC<Props> = ({ move, index, isSelected, onClick, className = "" }) => {
  const moveQuality = move.getQuality();

  let tileClasses = getAnnotationClasses(moveQuality);
  if (isSelected) {
    tileClasses = "bg-neutral-500/60 border text-neutral-300";
  }

  return (
    <div
      className={`flex-1 px-1.5 py-1 rounded text-xs sm:text-sm leading-tight cursor-pointer transition flex items-center ${tileClasses} ${className}`}
      onClick={() => onClick(index)}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1 font-semibold text-white">
          <MoveQualityIcon moveQuality={moveQuality} size="small" />
          <ChessPiece san={move.san} ply={move.ply} />
          <span>{move.san}</span>
        </div>
        <div className="flex items-end gap-1">
          {move.evaluation && (
            <span className={`${getEvalTextColor(isSelected)} text-[10px] opacity-80 ml-1`}>{formatEval(move)}</span>
          )}
        </div>
      </div>
    </div>
  );
};
