import React, { useEffect, useRef } from "react";

import { ChessPiece } from "@/components/ChessBoard/ChessPiece";
import { getAnnotationClasses } from "@/helpers/move-quality";
import type { GameMove } from "@/helpers/pgn";
import { isPawnsEval } from "@/helpers/pgn";

import { scrollIntoViewCentered } from "@/utils/dom";
import { MoveQualityIcon } from "./MoveQualityIcon";

type Props = {
  move: GameMove;
  index: number;
  isSelected: boolean;
  onClick: (index: number) => void;
  className?: string;
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
  const elementRef = useRef<HTMLDivElement | null>(null);

  let tileClasses = getAnnotationClasses(moveQuality);
  if (isSelected) {
    tileClasses = "bg-neutral-500/60 border text-neutral-300";
  }

  useEffect(() => {
    if (isSelected && elementRef.current) {
      scrollIntoViewCentered(elementRef.current);
    }
  }, [isSelected]);

  return (
    <div
      className={`flex-1 px-1.5 py-1 rounded text-xs sm:text-sm leading-tight cursor-pointer transition flex items-center ${tileClasses} ${className}`}
      onClick={() => onClick(index)}
      ref={elementRef}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1 font-semibold text-white">
          {moveQuality && <MoveQualityIcon moveQuality={moveQuality} size="small" />}
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
