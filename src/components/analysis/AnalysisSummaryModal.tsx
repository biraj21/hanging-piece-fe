import { XIcon } from "lucide-react";
import React from "react";

import type { MoveQuality, ParsedGame } from "@/helpers/pgn";
import type { BlackOrWhite } from "@/types";
import { MoveQualityIcon } from "./MoveQualityIcon";

type AnalysisSummary = {
  white: Record<MoveQuality, number>;
  black: Record<MoveQuality, number>;
};

type AnalysisSummaryModalProps = {
  game: ParsedGame;
  whiteName: string;
  blackName: string;
  userColor?: BlackOrWhite;
  onStart: () => void;
  onClose: () => void;
  afterAnalysis: boolean;
};

function calculateSummary(game: ParsedGame): AnalysisSummary {
  const summary: AnalysisSummary = {
    white: { blunder: 0, mistake: 0, inaccuracy: 0, good: 0, brilliant: 0 },
    black: { blunder: 0, mistake: 0, inaccuracy: 0, good: 0, brilliant: 0 },
  };

  for (const move of game.moves) {
    const quality = move.getQuality();
    if (!quality) {
      continue;
    }

    const color = move.ply % 2 === 1 ? "white" : "black";
    summary[color][quality]++;
  }

  return summary;
}

export const AnalysisSummaryModal: React.FC<AnalysisSummaryModalProps> = ({
  game,
  whiteName,
  blackName,
  userColor,
  onStart,
  onClose,
  afterAnalysis = false,
}) => {
  const summary = calculateSummary(game);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-800 border border-neutral-600 rounded-xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-neutral-800 border-b border-neutral-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Game Report</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1 hover:bg-neutral-700 rounded"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-5">
          <div className="bg-neutral-900/50 rounded-lg border border-neutral-700/50 overflow-x-auto">
            <table className="w-full min-w-[280px]">
              <thead>
                <tr className="border-b border-neutral-700/50">
                  <th className="text-left px-3 sm:px-4 py-3 w-12 sm:w-16"></th>
                  <th className="text-center px-3 sm:px-4 py-3 min-w-[100px]">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white shrink-0"></div>
                      <span className="text-xs font-semibold text-white whitespace-nowrap">
                        {whiteName || "White"}
                        {userColor === "white" && <span className="text-neutral-400 ml-1">(You)</span>}
                      </span>
                    </div>
                  </th>
                  <th className="text-center px-3 sm:px-4 py-3 min-w-[100px]">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-neutral-600 shrink-0"></div>
                      <span className="text-xs font-semibold text-white whitespace-nowrap">
                        {blackName || "Black"}
                        {userColor === "black" && <span className="text-neutral-400 ml-1">(You)</span>}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(["blunder", "mistake", "inaccuracy", "good", "brilliant"] as MoveQuality[]).map((quality) => {
                  const getCount = (player: "white" | "black"): number => {
                    const playerSummary = player === "white" ? summary.white : summary.black;
                    switch (quality) {
                      case "blunder":
                        return playerSummary.blunder;
                      case "mistake":
                        return playerSummary.mistake;
                      case "inaccuracy":
                        return playerSummary.inaccuracy;
                      case "good":
                        return playerSummary.good;
                      case "brilliant":
                        return playerSummary.brilliant;
                    }
                  };

                  return (
                    <tr key={quality} className="border-b border-neutral-700/50 last:border-b-0">
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex items-center justify-center">
                          <MoveQualityIcon moveQuality={quality} size="small" />
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-white">{getCount("white")}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-white">{getCount("black")}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer - Only show when opened right after analysis */}
        {afterAnalysis && (
          <div className="sticky bottom-0 bg-neutral-800 border-t border-neutral-600 px-6 py-4 3">
            <button
              onClick={onStart}
              className="w-full flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-sm text-white transition-colors shadow-lg hover:shadow-xl"
            >
              Start Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
