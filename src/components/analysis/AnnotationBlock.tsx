import React, { useState } from "react";

import { getAnnotationClasses } from "@/helpers/move-quality";
import type { GameMove, Variation } from "@/helpers/pgn";

import { TellMeWhyButton } from "./TellMeWhy";

type AnnotationBlockProps = {
  moves: readonly GameMove[];
  moveIndex: number;
  isSimple?: boolean; // simple annotation without best line
  explain: (moveIndex: number, annotationText: string) => Promise<void>;
  explainDisabled?: boolean;
  explanationLoading?: boolean;
};

export const AnnotationBlock: React.FC<AnnotationBlockProps> = ({
  moves,
  moveIndex,
  isSimple = false,
  explain: showExplanation,
  explainDisabled = false,
  explanationLoading = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  const move = moves[moveIndex];
  const moveQuality = move.getQuality();
  const bestLine: Variation = move.variations?.[0] || [];
  const annotationText = move.textComments.join(" ").trim();
  const hasBestLine = bestLine.length > 0;

  const handleExplain = async () => {
    try {
      if (explainDisabled || explanationLoading || !hasBestLine) {
        return;
      }

      await showExplanation(moveIndex, annotationText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate explanation");
    }
  };

  if (isSimple) {
    return (
      <div className="mt-2 ml-8 p-2 rounded-md text-sm leading-relaxed bg-neutral-700/50 border border-neutral-500 text-neutral-300">
        <div className="flex items-center gap-2">
          <span>{annotationText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 items-stretch mt-2">
      <span className="text-neutral-400 text-xs sm:text-sm font-semibold w-6 shrink-0 flex items-center justify-center opacity-75"></span>
      <div className={`flex-1 p-2 rounded-md text-sm font-medium leading-relaxed ${getAnnotationClasses(moveQuality)}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {moveQuality && moveQuality.charAt(0).toUpperCase() + moveQuality.slice(1)}.
            {hasBestLine && ` Best: ${bestLine.map((v) => v.san).join(" ")}`}
          </div>
          <div className="flex justify-end">
            <TellMeWhyButton
              onClick={handleExplain}
              disabled={explainDisabled || explanationLoading || !hasBestLine}
              loading={explanationLoading}
            />
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-200">{error}</p>}
      </div>
    </div>
  );
};
