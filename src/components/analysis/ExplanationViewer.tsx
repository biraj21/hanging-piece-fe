import { GraduationCapIcon, RotateCcwIcon } from "lucide-react";
import React, { useState } from "react";

import { getMoveQualityDisplay } from "@/helpers/move-quality";
import type { GameMove } from "@/helpers/pgn";
import type { BlackOrWhite, EngineMove, Explanation } from "@/types";

import { MoveQualityIcon } from "./MoveQualityIcon";

type ExplanationViewerProps = {
  move: GameMove;
  explanation: Explanation;
  userColor?: BlackOrWhite; // Color the user is playing as
  onVisualize: (lineMove: EngineMove, brush: "red" | "green") => void;
  onNavigateToOriginalMove?: () => void;
};

export const ExplanationViewer: React.FC<ExplanationViewerProps> = ({
  move,
  explanation: explanationProp,
  userColor,
  onVisualize,
  onNavigateToOriginalMove,
}) => {
  const { explanation, badContinuation, bestContinuation, badLine, bestLine } = explanationProp;

  const [selectedBadMove, setSelectedBadMove] = useState<number | null>(null);
  const [selectedBestMove, setSelectedBestMove] = useState<number | null>(null);

  // Helper function to render move notation with ply
  const renderMoveNotation = (san: string, ply: number) => {
    const moveNumber = Math.ceil(ply / 2);
    const isWhite = ply % 2 === 1;
    return isWhite ? `${moveNumber}. ${san}` : `${moveNumber}... ${san}`;
  };

  // Get the player who made the move being analyzed
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

  // Main explanation view
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-2.5 border-b border-neutral-600/50 flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-green-800 flex items-center justify-center shrink-0">
          <GraduationCapIcon size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-semibold text-neutral-200">Chess Coach</h3>
        </div>
      </div>

      {/* Content - Show everything at once, scrollable */}
      <div className="py-3 flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-4">
          {/* Move quality badge */}
          {
            <div className="flex items-center justify-between gap-2">
              <div className={`text-sm font-bold ${quality.color} flex items-center gap-2`}>
                {moveQuality && <MoveQualityIcon moveQuality={moveQuality} size="medium" />}
                <span>
                  {renderMoveNotation(move.san, move.ply)} was a {quality.text}
                </span>
              </div>
              {onNavigateToOriginalMove && (
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
              )}
            </div>
          }

          {/* Overview Explanation */}
          {explanation && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Overview</h4>
              <div className="text-sm text-neutral-300 leading-relaxed space-y-2">
                {explanation.split("\n").map((para, idx) => (
                  <p key={idx}>{para.trim()}</p>
                ))}
              </div>
            </div>
          )}

          {/* Bad Line Section - Collapsible */}
          {badContinuation.length > 0 && (
            <div className="border border-red-500/30 rounded-lg overflow-hidden">
              <div className="w-full px-3 py-2 bg-red-950/20 hover:bg-red-950/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">☠️</span>
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                    {`What goes wrong for ${playerLabel}`}
                  </h4>
                </div>
              </div>

              <div className="px-3 py-2 space-y-1 bg-red-950/10">
                {badContinuation.map((cont, idx) => {
                  return (
                    <MoveCard
                      key={`bad-${idx}`}
                      type="bad"
                      cont={cont}
                      ply={move.ply + idx + 1}
                      isSelected={selectedBadMove === idx}
                      onClick={() => {
                        setSelectedBestMove(null); // Deselect best move
                        setSelectedBadMove(idx);
                        onVisualize(badLine[idx], "red");
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Best Line Section - Collapsible */}
          {bestContinuation.length > 0 && (
            <div className="border border-emerald-500/30 rounded-lg overflow-hidden">
              <div className="w-full px-3 py-2 bg-emerald-950/20 hover:bg-emerald-950/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✅</span>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                    {`Best line for ${playerLabel}`}
                  </h4>
                </div>
              </div>

              <div className="px-3 py-2 space-y-1 bg-emerald-950/10">
                {bestContinuation.map((cont, idx) => {
                  return (
                    <MoveCard
                      key={`best-${idx}`}
                      type="best"
                      cont={cont}
                      ply={move.ply + idx}
                      isSelected={selectedBestMove === idx}
                      onClick={() => {
                        setSelectedBadMove(null); // Deselect bad move
                        setSelectedBestMove(idx);
                        onVisualize(bestLine[idx], "green");
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
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

  // Use static Tailwind classes based on type
  const baseClasses = isBest ? "hover:bg-emerald-950/30" : "hover:bg-red-950/30";

  const selectedClasses = isSelected
    ? isBest
      ? "bg-emerald-950/40 border border-emerald-500/50 shadow-lg"
      : "bg-red-950/40 border border-red-500/50 shadow-lg"
    : "border border-transparent";

  const textColorClass = isBest ? "text-emerald-400" : "text-red-400";

  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-start gap-2 text-sm px-2 py-1.5 rounded ${baseClasses} text-left cursor-pointer ${selectedClasses}`}
      title="Click to visualize this position"
    >
      <span className={`${textColorClass} font-mono font-semibold shrink-0 min-w-[60px]`}>
        {isWhite ? `${moveNum}. ${cont.move}` : `${moveNum}... ${cont.move}`}
      </span>
      <p className="text-xs text-neutral-300 leading-relaxed">{cont.reason}</p>
    </button>
  );
};
