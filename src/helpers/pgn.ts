import {
  isNormal,
  makeSquare,
  makeUci,
  parseUci,
  Position,
  type Board,
} from "chessops";
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
import { makeSan, parseSan } from "chessops/san";
import { SquareSet } from "chessops/squareSet";

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

export type MoveQuality = "blunder" | "mistake" | "inaccuracy";

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
  middlegameStart?: number;
  endgameStart?: number;
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

function collectionVariations(
  prevMoveNode: ChildNode<PgnNodeData>,
  basePosition: Position,
): Variation[] | undefined {
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

/**
 * Number of major (queens & rooks) and minor (bishops & knights) pieces on the board.
 */
function majorsAndMinors(board: Board): number {
  const majorsAndMinors = board.occupied.diff(board.king).diff(board.pawn);
  return majorsAndMinors.size();
}

function backrankSparse(board: Board): boolean {
  const whiteBackrank = board.white.intersect(SquareSet.backrank("white"));
  const blackBackrank = board.black.intersect(SquareSet.backrank("black"));
  return whiteBackrank.size() < 4 || blackBackrank.size() < 4;
}

function score(y: number, whiteCount: number, blackCount: number): number {
  if (whiteCount === 0 && blackCount === 0) return 0;

  if (whiteCount === 1 && blackCount === 0) return 1 + (8 - y);
  if (whiteCount === 2 && blackCount === 0) return y > 2 ? 2 + (y - 2) : 0;
  if (whiteCount === 3 && blackCount === 0) return y > 1 ? 3 + (y - 1) : 0;
  if (whiteCount === 4 && blackCount === 0) return y > 1 ? 3 + (y - 1) : 0;

  if (whiteCount === 0 && blackCount === 1) return 1 + y;
  if (whiteCount === 1 && blackCount === 1) return 5 + Math.abs(4 - y);
  if (whiteCount === 2 && blackCount === 1) return 4 + (y - 1);
  if (whiteCount === 3 && blackCount === 1) return 5 + (y - 1);

  if (whiteCount === 0 && blackCount === 2) return y < 6 ? 2 + (6 - y) : 0;
  if (whiteCount === 1 && blackCount === 2) return 4 + (7 - y);
  if (whiteCount === 2 && blackCount === 2) return 7;

  if (whiteCount === 0 && blackCount === 3) return y < 7 ? 3 + (7 - y) : 0;
  if (whiteCount === 1 && blackCount === 3) return 5 + (7 - y);

  if (whiteCount === 0 && blackCount === 4) return y < 7 ? 3 + (7 - y) : 0;

  return 0;
}

function mixedness(board: Board): number {
  let totalScore = 0;

  for (let y = 0; y <= 6; y++) {
    for (let x = 0; x <= 6; x++) {
      let whiteCount = 0;
      let blackCount = 0;

      for (let dy = 0; dy <= 2; dy++) {
        for (let dx = 0; dx <= 2; dx++) {
          const square = (y + dy) * 8 + (x + dx);
          if (square < 64) {
            const color = board.getColor(square);
            if (color === "white") {
              whiteCount++;
            } else if (color === "black") {
              blackCount++;
            }
          }
        }
      }

      totalScore += score(y + 1, whiteCount, blackCount);
    }
  }

  return totalScore;
}

/**
 * The function analyzes the sequence of positions generated by the moves and identifies
 * where the middlegame and endgame begin according to the same heuristics used by
 * lichess/scalachess.
 *
 * @see https://github.com/lichess-org/scalachess/blob/4765295c1cd366eec50050569b9ce14320f4f883/core/src/main/scala/Divider.scala
 *
 * generated by GLM-4.7
 */
function calculateGamePhases(
  position: Position,
  moves: GameMove[],
): {
  middlegameStart?: number;
  endgameStart?: number;
} {
  const testPosition = position.clone();
  let middlegameStart: number | undefined;
  let endgameStart: number | undefined;

  for (let i = 0; i < moves.length; i++) {
    const board = testPosition.board;

    if (middlegameStart === undefined) {
      const pieceCount = majorsAndMinors(board);
      const sparse = backrankSparse(board);
      const mixedScore = mixedness(board);

      if (pieceCount <= 10 || sparse || mixedScore > 150) {
        middlegameStart = i;
      }
    } else if (endgameStart === undefined) {
      const pieceCount = majorsAndMinors(board);
      if (pieceCount <= 6) {
        endgameStart = i;
      }
    }

    if (middlegameStart !== undefined && endgameStart !== undefined) {
      break;
    }

    const move = parseSan(testPosition, moves[i].san);
    if (move) {
      testPosition.play(move);
    }
  }

  return { middlegameStart, endgameStart };
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
      }),
    );
    prevMoveNode = moveNode;
  }

  const phasePositions = startingPosition(game.headers).unwrap().clone();
  const phases = calculateGamePhases(phasePositions, parsedGame.moves);
  parsedGame.middlegameStart = phases.middlegameStart;
  parsedGame.endgameStart = phases.endgameStart;

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

export interface PgnHeader {
  Event?: string;
  Site?: string;
  Date?: string;
  White?: string;
  Black?: string;
  Result?: string;
  ECO?: string;
  WhiteElo?: string;
  BlackElo?: string;
  TimeControl?: string;
  EndTime?: string;
  Termination?: string;
  SetUp?: string;
  FEN?: string;
}

export interface UciMove {
  from?: string;
  to: string;
  promotion?: string;
}

export interface ChessComGameData {
  gameId: string;
  pgnHeaders: PgnHeader;
  moves: UciMove[];
}

export interface ParsedPgnSimple {
  headers: Map<string, string>;
  moveCount: number;
}

/**
 *
 * @param pgn The PGN to parse
 * @returns PGN headers and `moveCount`.
 */
export function parsePgnSimple(pgn: string): ParsedPgnSimple {
  const games = parsePgn(pgn);
  if (games.length === 0) {
    return { headers: new Map(), moveCount: 0 };
  }

  const game = games[0];
  return {
    headers: game.headers,
    moveCount: Array.from(game.moves.mainline()).length,
  };
}

/**
 * Constructs a PGN string from decoded Chess.com game data
 */
export function constructPgnFromChessComGame(data: ChessComGameData): string {
  const { pgnHeaders, moves } = data;

  // Build headers
  const headersMap = new Map<string, string>();
  for (const [key, value] of Object.entries(pgnHeaders)) {
    if (value !== undefined && value !== null) {
      headersMap.set(key, value);
    }
  }

  const position = startingPosition(headersMap).unwrap();

  // Play moves and collect SANs
  const sans: string[] = [];
  for (const move of moves) {
    const uciMove = parseUci(
      `${move.from || ""}${move.to}${move.promotion || ""}`,
    );
    if (uciMove) {
      const san = makeSan(position, uciMove);
      sans.push(san);
      position.play(uciMove);
    }
  }

  // Format moves with move numbers
  let moveText = "";
  for (let i = 0; i < sans.length; i++) {
    const isWhite = i % 2 === 0;
    const moveNum = Math.floor(i / 2) + 1;

    if (isWhite) {
      moveText += `${moveNum}. ${sans[i]}`;
    } else {
      moveText += ` ${sans[i]} `;
    }

    // Add new line every 6 moves (3 complete pairs)
    if ((i + 1) % 6 === 0 && i < sans.length - 1) {
      moveText += "\n";
    }
  }

  const result = pgnHeaders.Result || "*";
  const headerLines = Array.from(headersMap.entries()).map(
    ([key, value]) => `[${key} "${value}"]`,
  );

  return `${headerLines.join("\n")}\n\n${moveText} ${result}`;
}
