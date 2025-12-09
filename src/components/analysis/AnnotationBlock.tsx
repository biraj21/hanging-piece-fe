import React from "react";

import type { GameMove, MoveQuality } from "@/helpers/pgn";
import { MoveQualityIcon } from "./MoveQualityIcon";
import { TellMeWhyButton } from "./TellMeWhy";

type Props = {
  move: GameMove;
  isSimple?: boolean; // simple annotation without best line
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

const AnnotationBlock: React.FC<Props> = ({ move, isSimple = false }) => {
  const moveQuality = move.getQuality();
  const bestLine = move.variations?.[0];
  const annotationText = move.textComments.join(" ").trim();

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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <MoveQualityIcon moveQuality={moveQuality} size="small" />
          {moveQuality && moveQuality.charAt(0).toUpperCase() + moveQuality.slice(1)}.
          {bestLine && ` Best: ${bestLine.join(" ")}`}
        </div>
        <TellMeWhyButton />
      </div>
    </div>
  );
};

export default AnnotationBlock;
