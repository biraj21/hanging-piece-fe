import type { MoveQuality, ParsedGame } from "@/helpers/pgn";
import type { BlackOrWhite } from "@/types";
import React from "react";

import { MoveQualityIcon } from "./MoveQualityIcon";

type AnalysisSummary = {
  white: Record<MoveQuality, number>;
  black: Record<MoveQuality, number>;
};

export interface AnalysisSummaryProps {
  game: ParsedGame;
  whiteName: string;
  blackName: string;
  userColor?: BlackOrWhite;
}

function calculateSummary(game: ParsedGame): AnalysisSummary {
  const summary: AnalysisSummary = {
    white: { blunder: 0, mistake: 0, inaccuracy: 0 },
    black: { blunder: 0, mistake: 0, inaccuracy: 0 },
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

const moveQualities: MoveQuality[] = ["blunder", "mistake", "inaccuracy"]; // , "good", "great", "brilliant"];

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
  game,
  whiteName,
  blackName,
  userColor,
}) => {
  const summary = calculateSummary(game);

  return (
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
                  {userColor === "white" && (
                    <span className="text-neutral-400 ml-1">(you)</span>
                  )}
                </span>
              </div>
            </th>
            <th className="text-center px-3 sm:px-4 py-3 min-w-[100px]">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-neutral-600 shrink-0"></div>
                <span className="text-xs font-semibold text-white whitespace-nowrap">
                  {blackName || "Black"}
                  {userColor === "black" && (
                    <span className="text-neutral-400 ml-1">(you)</span>
                  )}
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {moveQualities.map((quality) => {
            const getCount = (player: "white" | "black"): number => {
              const playerSummary =
                player === "white" ? summary.white : summary.black;
              switch (quality) {
                case "blunder":
                  return playerSummary.blunder;
                case "mistake":
                  return playerSummary.mistake;
                case "inaccuracy":
                  return playerSummary.inaccuracy;
                default:
                  return 0;
              }
            };

            return (
              <tr
                key={quality}
                className="border-b border-neutral-700/50 last:border-b-0"
              >
                <td className="px-3 sm:px-4 py-3">
                  <div className="flex items-center justify-center">
                    <MoveQualityIcon moveQuality={quality} size="small" />
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-white">
                    {getCount("white")}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-white">
                    {getCount("black")}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
