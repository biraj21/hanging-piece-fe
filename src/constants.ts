import type { MoveQuality } from "./helpers/pgn";

/**
 * Initial FEN for the starting position
 */
export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Default depth for Stockfish analysis
 */
export const STOCKFISH_DEFAULT_DEPTH = 15;

export const NUM_MOVES: Record<MoveQuality, number> = {
  blunder: 8,
  mistake: 5,
  inaccuracy: 3,
  good: 3,
  great: 5,
  brilliant: 8,
};
