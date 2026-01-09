import type { MoveQuality } from "@/helpers/pgn";

/**
 * Get the symbol for a move quality (e.g., "??", "?", "?!", "!", "!!")
 */
export function getMoveQualitySymbol(quality: MoveQuality): string {
  switch (quality) {
    case "blunder":
      return "??";
    case "mistake":
      return "?";
    case "inaccuracy":
      return "?!";
    case "good":
      return "!";
    case "great":
      return "!¡";
    case "brilliant":
      return "!!";
  }
}

/**
 * Get NAG (Numeric Annotation Glyph) from move quality
 * @param quality - Move quality
 * @returns NAG number or undefined
 */
export function getNagFromQuality(quality: MoveQuality): number | undefined {
  switch (quality) {
    case "blunder":
      return 4; // ??
    case "mistake":
      return 2; // ?
    case "inaccuracy":
      return 6; // ?!
    case "good":
      return 1; // !
    case "great":
      return 69; // custom NAG for "Great" move
    case "brilliant":
      return 3; // !!
    default:
      return undefined;
  }
}

/**
 * Get hex colors for move quality (for SVG/Canvas rendering)
 */
export function getMoveQualityColor(quality: MoveQuality): { bg: string; border: string } {
  switch (quality) {
    case "blunder":
      return { bg: "#ef4444", border: "#dc2626" };
    case "mistake":
      return { bg: "#f59e0b", border: "#d97706" };
    case "inaccuracy":
      return { bg: "#3b82f6", border: "#2563eb" };
    case "good":
      return { bg: "#22c55e", border: "#16a34a" };
    case "great":
      return { bg: "#06b6d4", border: "#0891b2" };
    case "brilliant":
      return { bg: "#a855f7", border: "#9333ea" };
    default:
      return { bg: "#6b7280", border: "#4b5563" };
  }
}

/**
 * Get Tailwind CSS classes for annotation blocks (background, border, text colors)
 */
export function getAnnotationClasses(moveQuality?: MoveQuality): string {
  switch (moveQuality) {
    case "blunder":
      return "bg-red-500/50 border border-red-500 text-red-100";
    case "mistake":
      return "bg-amber-500/50 border border-amber-500 text-amber-100";
    case "inaccuracy":
      return "bg-blue-500/50 border border-blue-500 text-blue-100";
    case "good":
      return "bg-emerald-500/50 border border-emerald-500 text-emerald-100";
    case "great":
      return "bg-cyan-500/50 border border-cyan-500 text-cyan-100";
    case "brilliant":
      return "bg-purple-500/50 border border-purple-500 text-purple-100";
    default:
      return "bg-neutral-800 text-neutral-200 border border-neutral-700";
  }
}

/**
 * Get Tailwind CSS classes for icon badges (solid colors)
 */
export function getIconColorClasses(moveQuality: MoveQuality): string {
  switch (moveQuality) {
    case "blunder":
      return "bg-red-500 text-white border-red-500";
    case "mistake":
      return "bg-amber-500 text-white border-amber-500";
    case "inaccuracy":
      return "bg-blue-500 text-white border-blue-500";
    case "good":
      return "bg-emerald-500 text-white border-emerald-500";
    case "great":
      return "bg-cyan-500 text-white border-cyan-500";
    case "brilliant":
      return "bg-purple-500 text-white border-purple-500";
    default:
      return "bg-gray-600 text-white border-gray-600";
  }
}

/**
 * Get display text and text color for move quality
 */
export function getMoveQualityDisplay(quality?: MoveQuality): { text: string; color: string } {
  switch (quality) {
    case "blunder":
      return { text: "BLUNDER", color: "text-red-400" };
    case "mistake":
      return { text: "MISTAKE", color: "text-amber-400" };
    case "inaccuracy":
      return { text: "INACCURACY", color: "text-blue-400" };
    case "good":
      return { text: "GOOD MOVE", color: "text-emerald-400" };
    case "great":
      return { text: "GREAT", color: "text-cyan-400" };
    case "brilliant":
      return { text: "BRILLIANT", color: "text-purple-400" };
    default:
      return { text: "MOVE", color: "text-neutral-400" };
  }
}
