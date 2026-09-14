import { getMoveQualityColor } from "@/helpers/move-quality";
import type { GameMove, Variation } from "@/helpers/pgn";
import clsx from "clsx";
import React, { useState } from "react";

import { TellMeWhyButton } from "./TellMeWhy";

type AnnotationBlockProps = {
  moves: readonly GameMove[];
  moveIndex: number;
  currentMoveIndex: number;
  isSimple?: boolean; // simple annotation without best line
  explain: (moveIndex: number, annotationText: string) => Promise<void>;
  explainDisabled?: boolean;
  explanationLoading?: boolean;
};

export const AnnotationBlock: React.FC<AnnotationBlockProps> = ({
  moves,
  moveIndex,
  currentMoveIndex,
  isSimple = false,
  explain: showExplanation,
  explainDisabled = false,
  explanationLoading = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  const move = moves[moveIndex];
  const moveQuality = move.getQuality();
  const qualityColors = moveQuality ? getMoveQualityColor(moveQuality) : null;
  const bestLine: Variation = move.variations?.[0] || [];
  const annotationText = move.textComments.join(" ").trim();
  const hasBestLine = bestLine.length > 0;

  const handleExplain = async () => {
    try {
      if (explainDisabled || explanationLoading || !hasBestLine) {
        return;
      }

      await showExplanation(moveIndex, annotationText);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate explanation",
      );
    }
  };

  if (isSimple) {
    return (
      <div className="mt-2 ml-8 p-3 rounded-lg text-sm leading-relaxed bg-neutral-800/75 text-neutral-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500/80 shrink-0" />
          <span>{annotationText}</span>
        </div>
      </div>
    );
  }

  if (moveIndex !== currentMoveIndex) {
    return;
  }

  return (
    <div className="flex gap-1.5 items-stretch mt-2">
      <span className="text-neutral-400 text-xs sm:text-sm font-semibold w-6 shrink-0 flex items-center justify-center opacity-0"></span>
      <div
        className={clsx(
          "relative overflow-hidden flex-1 p-3 text-sm font-medium leading-relaxed bg-neutral-800 rounded-tr-md rounded-br-md",
          {
            "bg-yellow-500/15": moveQuality === "inaccuracy",
            "bg-orange-500/15": moveQuality === "mistake",
            "bg-red-500/15": moveQuality === "blunder",
          },
        )}
        style={{
          borderLeft: `5px solid ${qualityColors?.border ?? "#737373"}`,
          // background: qualityColors?.border ?? "#737373",
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div>
              {move.textComments[0] && <span>{move.textComments[0]}</span>}
              {!move.textComments[0] && (
                <>
                  <span>{moveQuality}</span>
                  {hasBestLine && (
                    <span>&nbsp;{bestLine[0].san} was the best</span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasBestLine && (
                <span>Best line: {bestLine.map((v) => v.san).join(" ")}</span>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <TellMeWhyButton
              onClick={handleExplain}
              disabled={explainDisabled || !hasBestLine}
              loading={explanationLoading}
            />
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-200">{error}</p>}
      </div>
    </div>
  );
};
