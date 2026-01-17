import { EyeIcon, GraduationCapIcon, RotateCcwIcon } from "lucide-react";
import React, { useState } from "react";

import { getMoveQualityDisplay } from "@/helpers/move-quality";
import type { GameMove } from "@/helpers/pgn";
import type { BlackOrWhite, EngineMove, Explanation } from "@/types";

import { ExplanationLoading } from "./ExplanationLoading";
import { MoveQualityIcon } from "./MoveQualityIcon";

type ExplanationViewerProps = {
  move?: GameMove;
  explanation?: Explanation;
  isLoading?: boolean;
  userColor?: BlackOrWhite;
  onVisualize: (lineMove: EngineMove, brush: "red" | "green") => void;
  onNavigateToOriginalMove: () => void;
};

const ExplanationHeader: React.FC = () => (
  <div className="pb-2.5 border-b border-neutral-600/50 flex items-center gap-2 shrink-0">
    <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-green-800 flex items-center justify-center shrink-0">
      <GraduationCapIcon size={16} className="text-white" />
    </div>
    <div className="flex-1">
      <h3 className="text-xs font-semibold text-neutral-200">Chess Coach (beta)</h3>
      <p className="text-[10px] text-neutral-400">Explanations may contain inaccuracies</p>
    </div>
  </div>
);

const ExplanationContent: React.FC<{
  move: GameMove;
  explanation: Explanation;
  userColor?: BlackOrWhite;
  onVisualize: (lineMove: EngineMove, brush: "red" | "green") => void;
  onNavigateToOriginalMove: () => void;
}> = ({ move, explanation, userColor, onVisualize, onNavigateToOriginalMove }) => {
  const { explanation: text, badContinuation, bestContinuation, badLine, bestLine } = explanation;
  const [selectedBadMove, setSelectedBadMove] = useState<number | null>(null);
  const [selectedBestMove, setSelectedBestMove] = useState<number | null>(null);

  const renderMoveNotation = (san: string, ply: number) => {
    const moveNumber = Math.ceil(ply / 2);
    const isWhite = ply % 2 === 1;
    return isWhite ? `${moveNumber}. ${san}` : `${moveNumber}... ${san}`;
  };

  const getPlayerLabel = (): string => {
    const isWhite = move.ply % 2 === 1;
    const moveColor: BlackOrWhite = isWhite ? "white" : "black";

    if (!userColor) {
      return moveColor;
    }

    const player = moveColor === userColor ? "you" : "your opponent";
    return `${player} (${moveColor})`;
  };

  const playerLabel = getPlayerLabel();
  const moveQuality = move.getQuality();
  const quality = getMoveQualityDisplay(moveQuality);

  return (
    <div className="py-3 flex-1 min-h-0 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className={`text-sm font-bold ${quality.color} flex items-center gap-2`}>
            {moveQuality && <MoveQualityIcon moveQuality={moveQuality} size="medium" />}
            <span>
              {renderMoveNotation(move.san, move.ply)} was a {quality.text}
            </span>
          </div>

          <button
            onClick={() => {
              setSelectedBadMove(null);
              setSelectedBestMove(null);
              onNavigateToOriginalMove();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-700/50 hover:bg-neutral-700 rounded-md transition-colors border border-neutral-600/50 hover:border-neutral-500"
            title="View original position"
          >
            <RotateCcwIcon size={14} />
          </button>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Overview</h4>
          <div className="text-sm text-neutral-300 leading-relaxed space-y-2">
            {text.split("\n").map((para, idx) => (
              <p key={idx}>{para.trim()}</p>
            ))}
          </div>
        </div>

        {badContinuation.length > 0 && (
          <div className="bg-neutral-800/50 border border-neutral-600/50 rounded-lg overflow-hidden">
            <div className="w-full px-3 py-2.5 bg-neutral-700/40 border-b border-neutral-600/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <div>
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                    {`What goes wrong for ${playerLabel}`}
                  </h4>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-none">Click a move to visualize</p>
                </div>
              </div>
            </div>

            <div className="px-3 py-2.5 space-y-1.5">
              {badContinuation.map((cont, idx) => (
                <MoveCard
                  key={`bad-${idx}`}
                  type="bad"
                  cont={cont}
                  ply={move.ply + idx + 1}
                  isSelected={selectedBadMove === idx}
                  onClick={() => {
                    setSelectedBestMove(null);
                    setSelectedBadMove(idx);
                    onVisualize(badLine[idx], "red");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {bestContinuation.length > 0 && (
          <div className="bg-neutral-800/50 border border-neutral-600/50 rounded-lg overflow-hidden">
            <div className="w-full px-3 py-2.5 bg-neutral-700/40 border-b border-neutral-600/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                    {`What ${playerLabel} should have done`}
                  </h4>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-none">Click a move to visualize</p>
                </div>
              </div>
            </div>

            <div className="px-3 py-2.5 space-y-1.5">
              {bestContinuation.map((cont, idx) => (
                <MoveCard
                  key={`best-${idx}`}
                  type="best"
                  cont={cont}
                  ply={move.ply + idx}
                  isSelected={selectedBestMove === idx}
                  onClick={() => {
                    setSelectedBadMove(null);
                    setSelectedBestMove(idx);
                    onVisualize(bestLine[idx], "green");
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MoveCardProps {
  type: "bad" | "best";
  cont: {
    move: string;
    color?: string | undefined;
    reason: string;
  };
  ply: number;
  isSelected: boolean;
  onClick: () => void;
}

const MoveCard: React.FC<MoveCardProps> = ({ type, cont, ply, isSelected, onClick }) => {
  const moveNum = Math.ceil(ply / 2);
  const isWhite = ply % 2 === 1;
  const isBest = type === "best";

  const baseClasses = "hover:bg-neutral-700/50 transition-colors";

  const selectedClasses = isSelected
    ? isBest
      ? "bg-emerald-500/10 border-l-2 border-l-emerald-500"
      : "bg-red-500/10 border-l-2 border-l-red-500"
    : "border-l-2 border-l-transparent";

  const moveNotationClass = isSelected
    ? isBest
      ? "text-emerald-400 font-semibold"
      : "text-red-400 font-semibold"
    : "text-neutral-200 font-medium";

  return (
    <button
      onClick={onClick}
      className={`group w-full text-sm p-2 rounded ${baseClasses} text-left cursor-pointer ${selectedClasses}`}
      title="Click to visualize this position"
    >
      <div className="flex items-center">
        <span className={`${moveNotationClass} font-mono shrink-0 text-sm`}>
          {isWhite ? `${moveNum}. ${cont.move}` : `${moveNum}... ${cont.move}`}
        </span>
        <EyeIcon
          size={14}
          className={`ml-2 shrink-0 transition-opacity ${
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-70"
          } ${isBest ? "text-emerald-400" : "text-red-400"}`}
        />
      </div>

      <p className="text-xs text-neutral-400 leading-relaxed flex-1 pt-0.5">{cont.reason}</p>
    </button>
  );
};

export const ExplanationViewer: React.FC<ExplanationViewerProps> = ({
  move,
  explanation,
  isLoading = false,
  userColor,
  onVisualize,
  onNavigateToOriginalMove,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <ExplanationHeader />
        <ExplanationLoading />
      </div>
    );
  }

  if (!explanation || !move) {
    return (
      <div className="flex flex-col h-full">
        <ExplanationHeader />
        <p className="text-center text-sm text-neutral-400 mb-2 max-w-sm mx-auto py-8">
          Click the "Tell me why" button that looks like this on any of your mistakes to get an explanation
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ExplanationHeader />
      <ExplanationContent
        move={move}
        explanation={explanation}
        userColor={userColor}
        onVisualize={onVisualize}
        onNavigateToOriginalMove={onNavigateToOriginalMove}
      />
    </div>
  );
};
