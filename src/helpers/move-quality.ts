import type { MoveQuality } from "@/helpers/pgn";
import clsx from "clsx";

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
    default:
      return undefined;
  }
}

/**
 * Get hex colors for move quality (for SVG/Canvas rendering)
 */
export function getMoveQualityColor(quality: MoveQuality): {
  bg: string;
  border: string;
} {
  switch (quality) {
    case "blunder":
      return {
        bg: "oklch(63.7% 0.237 25.331)",
        border: "oklch(63.7% 0.237 25.331)",
      };
    case "mistake":
      return {
        bg: "oklch(70.5% 0.213 47.604)",
        border: "oklch(70.5% 0.213 47.604)",
      };
    case "inaccuracy":
      return {
        bg: "oklch(79.5% 0.184 86.047)",
        border: "oklch(79.5% 0.184 86.047)",
      };
    default:
      return { bg: "#6b7280", border: "#4b5563" };
  }
}

/**
 * Get Tailwind CSS classes for annotation blocks (background, border, text colors)
 */
export function getMoveClasses(
  moveQuality?: MoveQuality,
  isSelected?: boolean,
): string {
  switch (moveQuality) {
    case "blunder":
      return clsx("bg-red-500/50 border-2", {
        "border-transparent": !isSelected,
        "border-red-500": isSelected,
      });
    case "mistake":
      return clsx("bg-neutral-800 bg-orange-500/50 border-2", {
        "border-transparent": !isSelected,
        "border-orange-500": isSelected,
      });
    case "inaccuracy":
      return clsx("bg-yellow-500/50 border-2", {
        "border-transparent": !isSelected,
        "border-yellow-500": isSelected,
      });
    default:
      return clsx(" text-neutral-200 border-2", {
        "border-transparent bg-neutral-800": !isSelected,
        "border-neutral-500 bg-neutral-600": isSelected,
      });
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
      return "bg-orange-500 text-white border-orange-500";
    case "inaccuracy":
      return "bg-yellow-500 text-white border-yellow-500";
    default:
      return "bg-gray-600 text-white border-gray-600";
  }
}

/**
 * Get display text and text color for move quality
 */
export function getMoveQualityDisplay(quality?: MoveQuality): {
  text: string;
  color: string;
} {
  switch (quality) {
    case "blunder":
      return { text: "BLUNDER", color: "text-red-400" };
    case "mistake":
      return { text: "MISTAKE", color: "text-orange-400" };
    case "inaccuracy":
      return { text: "INACCURACY", color: "text-yellow-400" };
    default:
      return { text: "MOVE", color: "text-neutral-400" };
  }
}
