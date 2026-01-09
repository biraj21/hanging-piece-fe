import { isNormal, makeSquare, makeUci, type Position } from "chessops";
import { makeFen } from "chessops/fen";
import {
  parseComment,
  parsePgn,
  startingPosition,
  type ChildNode,
  type Evaluation,
  type EvaluationMate,
  type EvaluationPawns,
  type PgnNodeData,
} from "chessops/pgn";
import { parseSan } from "chessops/san";

export type VariationMove = {
  san: string;
  /** FEN after this move */
  fen: string;
  /** FEN before this move */
  beforeFen: string;
  /** Square the piece moved from */
  from: string;
  /** Square the piece moved to */
  to: string;
  /** UCI notation for the move */
  uci: string;
};

/** Best continuation (array of moves with FENs) if this move was suboptimal */
export type Variation = VariationMove[];

export type MoveQuality = "blunder" | "mistake" | "inaccuracy" | "good" | "great" | "brilliant";

/** Named args for GameMove construction */
export interface GameMoveInit {
  /** Move number in half-moves (1 = first white move, 2 = first black move, etc.) */
  ply: number;
  /** Standard Algebraic Notation (e.g., "e4", "Nf3") */
  san: string;
  /** FEN position after this move */
  fen: string;
  /** Square the piece moved from */
  from: string;
  /** Square the piece moved to */
  to: string;
  /** UCI notation (e.g., "e2e4", "g1f3") - used for board highlighting */
  uci: string;
  /** Text annotations (e.g., "Inaccuracy. Re8 was best.") */
  textComments: string[];
  /** Engine evaluation after this move */
  evaluation?: Evaluation;
  /** NAGs (Numeric Annotation Glyphs) after this move */
  nags?: number[];
  /** Clock time in seconds after this move */
  clock?: number;
  /** Best continuations (array of Variations, which includes SAN + before/after FEN) */
  variations?: Variation[];
}

/**
 * Structured representation of a move and its annotations.
 */
export class GameMove {
  /** Move number in half-moves (1 = first white move, 2 = first black move, etc.) */
  public readonly ply: number;
  /** Standard Algebraic Notation (e.g., "e4", "Nf3") */
  public readonly san: string;
  /** FEN position after this move */
  public readonly fen: string;
  /** Square the piece moved from */
  public readonly from: string;
  /** Square the piece moved to */
  public readonly to: string;
  /** UCI notation (e.g., "e2e4", "g1f3") - used for board highlighting */
  public readonly uci: string;
  /** Text annotations (e.g., "Inaccuracy. Re8 was best.") */
  public readonly textComments: string[];
  /** Engine evaluation after this move */
  public readonly evaluation?: Evaluation;
  /** NAGs (Numeric Annotation Glyphs) after this move */
  public readonly nags?: number[];
  /** Clock time in seconds after this move */
  public readonly clock?: number;
  /** Best continuations (array of Variations, which is an array of SANs) */
  public readonly variations?: Variation[];

  constructor(init: GameMoveInit) {
    this.ply = init.ply;
    this.san = init.san;
    this.fen = init.fen;
    this.from = init.from;
    this.to = init.to;
    this.uci = init.uci;
    this.textComments = init.textComments;
    this.evaluation = init.evaluation;
    this.nags = init.nags;
    this.clock = init.clock;
    this.variations = init.variations;
  }

  /**
   * Derive a quality label from NAGs (Numeric Annotation Glyphs).
   * Prioritises more severe glyphs first.
   */
  getQuality(): MoveQuality | undefined {
    if (!this.nags || this.nags.length === 0) {
      return;
    }

    const priority: Array<{ nag: number; quality: MoveQuality }> = [
      { nag: 4, quality: "blunder" }, // ??
      { nag: 2, quality: "mistake" }, // ?
      { nag: 6, quality: "inaccuracy" }, // ?!
      { nag: 3, quality: "brilliant" }, // !!
      { nag: 1, quality: "good" }, // !
      { nag: 5, quality: "good" }, // !?
    ];

    for (const { nag, quality } of priority) {
      if (this.nags.includes(nag)) {
        return quality;
      }
    }

    return;
  }
}

/**
 * Parsed game with headers and moves
 */
export interface ParsedGame {
  headers: Map<string, string>;
  moves: GameMove[];
}

/**
 * Parses a SAN move and advances the position by playing it.
 *
 * **IMPORTANT**: This function mutates the `position` object by calling `position.play()`.
 *
 * @param position - The chess position to play the move on (will be mutated)
 * @param san - Standard Algebraic Notation of the move (e.g., "e4", "Nf3")
 * @returns Object containing move details: fen (after), beforeFen, from, to, uci
 * @throws Error if the move is illegal
 */
function parseSanAndAdvancePosition(position: Position, san: string) {
  const beforeFen = makeFen(position.toSetup());
  const move = parseSan(position, san);
  if (!move) {
    throw new Error(`Illegal variation move at ${san}`);
  }

  let from: string;
  let to: string;
  if (isNormal(move)) {
    from = makeSquare(move.from);
    to = makeSquare(move.to);
  } else {
    from = makeSquare(move.to);
    to = makeSquare(move.to);
  }
  const uci = makeUci(move);

  position.play(move);
  const fen = makeFen(position.toSetup());

  return {
    fen,
    beforeFen,
    from,
    to,
    uci,
  };
}

function collectionVariations(prevMoveNode: ChildNode<PgnNodeData>, basePosition: Position): Variation[] | undefined {
  if (prevMoveNode.children.length === 1) {
    return undefined;
  }

  const variations: Variation[] = [];

  for (let i = 1; i < prevMoveNode.children.length; i++) {
    const variation: Variation = [];
    const position = basePosition.clone();
    let current = prevMoveNode.children[i];
    while (current) {
      const san = current.data.san;
      const moveDetails = parseSanAndAdvancePosition(position, san);
      variation.push({
        san,
        ...moveDetails,
      });
      current = current.children[0];
    }
    variations.push(variation);
  }

  return variations;
}

export function isPawnsEval(ev: Evaluation): ev is EvaluationPawns {
  return "pawns" in ev;
}

export function isMateEval(ev: Evaluation): ev is EvaluationMate {
  return "mate" in ev;
}

export function parsePgnToGame(pgn: string): ParsedGame {
  const games = parsePgn(pgn);
  if (games.length === 0) {
    return { headers: new Map(), moves: [] };
  }

  const game = games[0];

  // Get starting position
  const position = startingPosition(game.headers).unwrap().clone();

  const parsedGame: ParsedGame = {
    headers: game.headers,
    moves: [],
  };

  let prevMoveNode: ChildNode<PgnNodeData> | undefined;
  for (const moveNode of game.moves.mainlineNodes()) {
    const comments = moveNode.data.comments || [];
    const parsedComments = comments.map(parseComment);

    const textComments: string[] = [];
    let evaluation: Evaluation | undefined;
    let clock: number | undefined;
    let variations: Variation[] | undefined;

    for (const c of parsedComments) {
      if (c.text) {
        textComments.push(c.text);
      }

      if (c.evaluation) {
        evaluation = c.evaluation;
      }

      if (c.clock !== undefined) {
        clock = c.clock;
      }
    }

    // current move is children[0] of previous move, so the variations would be
    // children[1], children[2], etc. of the previous move
    if (prevMoveNode) {
      variations = collectionVariations(prevMoveNode, position.clone());
    }

    const san = moveNode.data.san;
    const moveDetails = parseSanAndAdvancePosition(position, san);

    parsedGame.moves.push(
      new GameMove({
        ply: parsedGame.moves.length + 1,
        san,
        fen: moveDetails.fen,
        from: moveDetails.from,
        to: moveDetails.to,
        uci: moveDetails.uci,
        textComments,
        evaluation,
        nags: moveNode.data.nags,
        clock,
        variations,
      })
    );
    prevMoveNode = moveNode;
  }

  return parsedGame;
}

/**
 * Check if a parsed game has analysis (evaluations or NAGs)
 * @param game - Parsed game
 * @returns true if game has analysis annotations
 */
export function hasAnalysis(game: ParsedGame): boolean {
  return game.moves.some((move) => {
    return (move.nags && move.nags.length > 0) || move.evaluation !== undefined;
  });
}
