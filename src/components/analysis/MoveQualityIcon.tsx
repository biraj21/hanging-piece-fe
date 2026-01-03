import React from "react";

import { getIconColorClasses, getMoveQualitySymbol } from "@/helpers/move-quality";
import type { MoveQuality } from "@/helpers/pgn";

type MoveQualityIconProps = {
  moveQuality: MoveQuality;
  size?: "small" | "medium";
};

const getSymbolClasses = (moveQuality: MoveQuality, size: "small" | "medium") => {
  const baseClasses =
    "rounded-full flex items-center justify-center font-bold border tracking-tighter leading-none shrink-0";

  const sizeClasses = size === "small" ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm";
  const colorClasses = getIconColorClasses(moveQuality);

  return `${baseClasses} ${sizeClasses} ${colorClasses}`;
};

export const MoveQualityIcon: React.FC<MoveQualityIconProps> = ({ moveQuality, size = "small" }) => {
  const symbol = getMoveQualitySymbol(moveQuality);
  return <div className={getSymbolClasses(moveQuality, size)}>{symbol}</div>;
};
