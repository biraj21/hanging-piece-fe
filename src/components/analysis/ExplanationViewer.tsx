import { GraduationCap, RotateCcw } from "lucide-react";
import React, { useState } from "react";

import type { GameMove } from "@/helpers/pgn";
import type { EngineLineMove } from "@/types";

import { MoveQualityIcon } from "./MoveQualityIcon";

type ExplanationViewerProps = {
  move: GameMove;
  explanation: string;
  badContinuation: Array<{ move: string; color?: string; reason: string }>;
  bestContinuation: Array<{ move: string; color?: string; reason: string }>;
  badLine: Array<EngineLineMove>;
  bestLine: Array<EngineLineMove>;
  onVisualize: (lineMove: EngineLineMove) => void;
  onNavigateToOriginalMove?: () => void;
};

const getMoveQualityDisplay = (quality: string | null) => {
  switch (quality) {
    case "blunder":
      return { text: "BLUNDER", color: "text-red-400" };
    case "mistake":
      return { text: "MISTAKE", color: "text-orange-400" };
    case "inaccuracy":
      return { text: "INACCURACY", color: "text-blue-400" };
    case "good":
      return { text: "GOOD MOVE", color: "text-emerald-400" };
    case "brilliant":
      return { text: "BRILLIANT", color: "text-purple-400" };
    default:
      return { text: "MOVE", color: "text-neutral-400" };
  }
};

export const ExplanationViewer: React.FC<ExplanationViewerProps> = ({
  move,
  explanation,
  badContinuation,
  bestContinuation,
  badLine,
  bestLine,
  onVisualize,
  onNavigateToOriginalMove,
}) => {
  const [selectedBadMove, setSelectedBadMove] = useState<number | null>(null);
  const [selectedBestMove, setSelectedBestMove] = useState<number | null>(null);

  // Helper function to render move notation with ply
  const renderMoveNotation = (san: string, ply: number) => {
    const moveNumber = Math.ceil(ply / 2);
    const isWhite = ply % 2 === 1;
    return isWhite ? `${moveNumber}. ${san}` : `${moveNumber}... ${san}`;
  };

  const moveQuality = move.getQuality();
  const quality = getMoveQualityDisplay(moveQuality);

  // Main explanation view
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-2.5 border-b border-neutral-600/50 flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-green-800 flex items-center justify-center shrink-0">
          <GraduationCap size={16} className="text-white" />
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
                <MoveQualityIcon moveQuality={moveQuality} size="medium" />
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
                  <RotateCcw size={14} />
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
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide">What goes wrong</h4>
                </div>
              </div>

              <div className="px-3 py-2 space-y-1 bg-red-950/10">
                {badContinuation.map((cont, idx) => {
                  return (
                    <MoveCard
                      type="bad"
                      cont={cont}
                      ply={move.ply + idx + 1}
                      isSelected={selectedBadMove === idx}
                      onClick={() => {
                        setSelectedBestMove(null); // Deselect best move
                        setSelectedBadMove(idx);
                        onVisualize(badLine[idx]);
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
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Best line</h4>
                </div>
              </div>

              <div className="px-3 py-2 space-y-1 bg-emerald-950/10">
                {bestContinuation.map((cont, idx) => {
                  return (
                    <MoveCard
                      type="best"
                      cont={cont}
                      ply={move.ply + idx}
                      isSelected={selectedBestMove === idx}
                      onClick={() => {
                        setSelectedBadMove(null); // Deselect bad move
                        setSelectedBestMove(idx);
                        onVisualize(bestLine[idx]);
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
  const color = type === "best" ? "emerald" : "red";

  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-start gap-2 text-sm px-2 py-1.5 rounded hover:bg-${color}-950/30 text-left cursor-pointer ${
        isSelected ? `bg-${color}-950/40 border border-${color}-500/50 shadow-lg` : "border border-transparent"
      }`}
      title="Click to visualize this position"
    >
      <span className={`text-{color}-400 font-mono font-semibold shrink-0 min-w-[60px]`}>
        {isWhite ? `${moveNum}. ${cont.move}` : `${moveNum}... ${cont.move}`}
      </span>
      <p className="text-xs text-neutral-300 leading-relaxed">{cont.reason}</p>
    </button>
  );
};
