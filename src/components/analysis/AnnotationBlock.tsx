import React, { useState } from "react";

import type { GameMove, MoveQuality, Variation } from "@/helpers/pgn";

import { MoveQualityIcon } from "./MoveQualityIcon";
import { TellMeWhyButton } from "./TellMeWhy";

type AnnotationBlockProps = {
  moves: readonly GameMove[];
  moveIndex: number;
  isSimple?: boolean; // simple annotation without best line
  explain: (moveIndex: number, annotationText: string) => Promise<void>;
  explainDisabled?: boolean;
};

const getAnnotationClasses = (moveQuality?: MoveQuality) => {
  switch (moveQuality) {
    case "blunder":
      return "bg-red-500/50 border border-red-500 text-red-100";
    case "mistake":
      return "bg-amber-500/50 border border-amber-500 text-amber-100";
    case "inaccuracy":
      return "bg-blue-500/50 border border-blue-500 text-blue-100";
    case "good":
      return "bg-emerald-500/50 border border-emerald-500 text-emerald-100";
    default:
      return "bg-neutral-700/50 border border-neutral-500 text-neutral-300";
  }
};

export const AnnotationBlock: React.FC<AnnotationBlockProps> = ({
  moves,
  moveIndex,
  isSimple = false,
  explain: showExplanation,
  explainDisabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const move = moves[moveIndex];
  const moveQuality = move.getQuality();
  const bestLine: Variation = move.variations?.[0] || [];
  const annotationText = move.textComments.join(" ").trim();
  const hasBestLine = bestLine.length > 0;

  const handleExplain = async () => {
    try {
      if (explainDisabled || loading || !hasBestLine) {
        return;
      }

      setLoading(true);
      await showExplanation(moveIndex, annotationText);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate explanation");
    } finally {
      setLoading(false);
    }
  };

  if (isSimple) {
    return (
      <div className="mt-2 ml-8 p-2 rounded-lg text-sm leading-relaxed bg-neutral-700/50 border border-neutral-500 text-neutral-300">
        <div className="flex items-center gap-2">
          <span>{annotationText}</span>
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
          {moveQuality && <MoveQualityIcon moveQuality={moveQuality} size="small" />}
          {moveQuality && moveQuality.charAt(0).toUpperCase() + moveQuality.slice(1)}.
          {hasBestLine && ` Best: ${bestLine.map((v) => v.san).join(" ")}`}
        </div>
        <div className="flex justify-end">
          <TellMeWhyButton
            onClick={handleExplain}
            disabled={explainDisabled || loading || !hasBestLine}
            loading={loading}
          />
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-200">{error}</p>}
    </div>
  );
};
