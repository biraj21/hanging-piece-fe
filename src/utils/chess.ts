import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { parseUci } from "chessops/util";

export type ContinuationMove = {
  san: string;
  uci: string;
  beforeFen: string;
  afterFen: string;
};

/**
 * Convert UCI moves to full continuation with SAN and FENs
 */
export function parseUciContinuation(
  uciMoves: string[],
  startFen: string,
): ContinuationMove[] {
  const result: ContinuationMove[] = [];

  // Parse starting position
  const setup = parseFen(startFen).unwrap();
  const position = Chess.fromSetup(setup).unwrap();

  for (const uciMove of uciMoves) {
    const beforeFen = makeFen(position.toSetup());

    // Parse and validate the UCI move
    const move = parseUci(uciMove);
    if (!move) {
      throw new Error(`Failed to parse UCI move: ${uciMove}`);
    }

    // Check if move is legal in current position
    if (!position.isLegal(move)) {
      throw new Error(`Illegal move: ${uciMove} at position ${beforeFen}`);
    }

    const san = makeSan(position, move);

    position.play(move);
    const afterFen = makeFen(position.toSetup());

    result.push({
      san,
      uci: uciMove,
      beforeFen,
      afterFen,
    });
  }

  return result;
}

/**
 * Generate a hash for the game (simple hash of PGN moves)
 */
export function generateGameHash(
  moves: Array<{ san: string; fen: string }>,
): string {
  // Create a simple hash from the move sequence and final position
  const moveString = moves.map((m) => m.san).join("");
  const finalFen = moves[moves.length - 1]?.fen || "";
  const combined = `${moveString}|${finalFen}`;

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}
