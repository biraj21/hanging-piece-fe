import { XIcon } from "lucide-react";
import React from "react";

import type { MoveQuality } from "@/helpers/pgn";

import { AnalysisSummary, type AnalysisSummaryProps } from "./AnalysisSummary";

type AnalysisSummary = {
  white: Record<MoveQuality, number>;
  black: Record<MoveQuality, number>;
};

interface AnalysisSummaryModalProps extends AnalysisSummaryProps {
  onStart: () => void;
  onClose: () => void;
  afterAnalysis: boolean;
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-800 border border-neutral-600 rounded-xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-neutral-800 border-b border-neutral-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Game Summary</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1 hover:bg-neutral-700 rounded"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-5">
          <AnalysisSummary game={game} whiteName={whiteName} blackName={blackName} userColor={userColor} />
        </div>

        {/* Footer - Only show when opened right after analysis */}
        {afterAnalysis && (
          <div className="sticky bottom-0 bg-neutral-800 border-t border-neutral-600 px-6 py-4">
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
