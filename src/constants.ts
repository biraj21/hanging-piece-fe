import { isMobileDevice } from "@/utils/device";
import type { MoveQuality } from "./helpers/pgn";

/**
 * Initial FEN for the starting position
 */
export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Default depth for Stockfish analysis
 */
export const STOCKFISH_DEFAULT_DEPTH = isMobileDevice() ? 12 : 15;

export const CONTINUATION_LENGTH: Record<MoveQuality, number> = {
  blunder: 8,
  mistake: 5,
  inaccuracy: 5,
};
