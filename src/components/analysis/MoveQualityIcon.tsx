import React from "react";

import { getMoveQualitySymbol, type MoveQuality } from "@/helpers/pgn";

type MoveQualityIconProps = {
  moveQuality: MoveQuality;
  size?: "small" | "medium";
};

const getSymbolClasses = (
  moveQuality: MoveQuality,

  size: "small" | "medium"
) => {
  const baseClasses =
    "rounded-full flex items-center justify-center font-bold  border tracking-tighter leading-none shrink-0";

  const sizeClasses = size === "small" ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm";

  const colorClasses = (() => {
    switch (moveQuality) {
      case "blunder":
        return "bg-red-500 text-white border-red-500";
      case "mistake":
        return "bg-amber-500 text-white border-amber-500";
      case "inaccuracy":
        return "bg-blue-500 text-white border-blue-500";
      case "good":
        return "bg-emerald-500 text-white border-emerald-500";
      case "brilliant":
        return "bg-purple-500 text-white border-purple-500";
      default:
        return "bg-gray-600 text-white border-gray-600";
    }
  })();

  return `${baseClasses} ${sizeClasses} ${colorClasses}`;
};

export const MoveQualityIcon: React.FC<MoveQualityIconProps> = ({ moveQuality, size = "small" }) => {
  const symbol = getMoveQualitySymbol(moveQuality);
  if (!symbol) {
    return null;
  }

  return <div className={getSymbolClasses(moveQuality, size)}>{symbol}</div>;
};
