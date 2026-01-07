/**
 * threat-analyzer.ts
 *
 * Computes tactical threat changes between chess positions using chessops.
 * Designed to provide factual tactical info to an LLM so it doesn't have to
 * guess/hallucinate what pieces are attacked.
 */

import { bishopAttacks, kingAttacks, knightAttacks, pawnAttacks, queenAttacks, rookAttacks } from "chessops/attacks";
import { Board } from "chessops/board";
import { parseFen } from "chessops/fen";
import { SquareSet } from "chessops/squareSet";
import type { Color, Piece, Role, Square } from "chessops/types";
import { parseSquare } from "chessops/util";

const SQUARE_NAMES = [
  "a1",
  "b1",
  "c1",
  "d1",
  "e1",
  "f1",
  "g1",
  "h1",
  "a2",
  "b2",
  "c2",
  "d2",
  "e2",
  "f2",
  "g2",
  "h2",
  "a3",
  "b3",
  "c3",
  "d3",
  "e3",
  "f3",
  "g3",
  "h3",
  "a4",
  "b4",
  "c4",
  "d4",
  "e4",
  "f4",
  "g4",
  "h4",
  "a5",
  "b5",
  "c5",
  "d5",
  "e5",
  "f5",
  "g5",
  "h5",
  "a6",
  "b6",
  "c6",
  "d6",
  "e6",
  "f6",
  "g6",
  "h6",
  "a7",
  "b7",
  "c7",
  "d7",
  "e7",
  "f7",
  "g7",
  "h7",
  "a8",
  "b8",
  "c8",
  "d8",
  "e8",
  "f8",
  "g8",
  "h8",
] as const;

const PIECE_VALUES: Record<Role, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

interface PieceAttack {
  attackerSquare: Square;
  attackerPiece: Piece;
  targetSquare: Square;
  targetPiece: Piece;
}

export interface ThreatInfo {
  attacks: string[]; // Direct attacks by the moved piece
  discoveredAttacks: string[]; // Attacks revealed by moving
  hangingPieces: string[]; // Undefended pieces under attack
  checks: string[]; // If the king is in check
  materialAtRisk: number; // Max material threatened
}

function squareName(sq: Square): string {
  return SQUARE_NAMES[sq];
}

function roleName(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getAttacksFrom(board: Board, square: Square, piece: Piece): SquareSet {
  const occupied = board.occupied;
  switch (piece.role) {
    case "pawn":
      return pawnAttacks(piece.color, square);
    case "knight":
      return knightAttacks(square);
    case "bishop":
      return bishopAttacks(square, occupied);
    case "rook":
      return rookAttacks(square, occupied);
    case "queen":
      return queenAttacks(square, occupied);
    case "king":
      return kingAttacks(square);
    default:
      return SquareSet.empty();
  }
}

function getDefenderCount(board: Board, square: Square, byColor: Color): number {
  let count = 0;
  for (const sq of board[byColor]) {
    if (sq === square) continue;
    const piece = board.get(sq);
    if (!piece) continue;
    if (getAttacksFrom(board, sq, piece).has(square)) count++;
  }
  return count;
}

function getAllAttacksOnEnemyPieces(board: Board, attackingColor: Color): PieceAttack[] {
  const attacks: PieceAttack[] = [];
  const enemyColor: Color = attackingColor === "white" ? "black" : "white";

  for (const attackerSq of board[attackingColor]) {
    const attackerPiece = board.get(attackerSq);
    if (!attackerPiece) continue;

    const attackSet = getAttacksFrom(board, attackerSq, attackerPiece);

    for (const targetSq of board[enemyColor]) {
      if (attackSet.has(targetSq)) {
        const targetPiece = board.get(targetSq);
        if (targetPiece) {
          attacks.push({ attackerSquare: attackerSq, attackerPiece, targetSquare: targetSq, targetPiece });
        }
      }
    }
  }
  return attacks;
}

/**
 * Analyze threats after a move.
 *
 * @param beforeFen - FEN before the move
 * @param afterFen - FEN after the move
 * @param uci - UCI move string (e.g., "d4b3")
 * @param movingColor - Color that made the move
 */
export function analyzeThreatDelta(beforeFen: string, afterFen: string, uci: string, movingColor: Color): ThreatInfo {
  const result: ThreatInfo = {
    attacks: [],
    discoveredAttacks: [],
    hangingPieces: [],
    checks: [],
    materialAtRisk: 0,
  };

  const beforeSetup = parseFen(beforeFen);
  const afterSetup = parseFen(afterFen);

  if (beforeSetup.isErr || afterSetup.isErr) return result;

  const beforeBoard = beforeSetup.value.board;
  const afterBoard = afterSetup.value.board;
  const enemyColor: Color = movingColor === "white" ? "black" : "white";

  const fromSq = parseSquare(uci.slice(0, 2));
  const toSq = parseSquare(uci.slice(2, 4));
  if (fromSq === undefined || toSq === undefined) return result;

  const attacksBefore = getAllAttacksOnEnemyPieces(beforeBoard, movingColor);
  const attacksAfter = getAllAttacksOnEnemyPieces(afterBoard, movingColor);

  // Find new attacks
  const seenTargets = new Set<Square>();

  for (const atk of attacksAfter) {
    const existedBefore = attacksBefore.some(
      (b) => b.attackerSquare === atk.attackerSquare && b.targetSquare === atk.targetSquare
    );

    if (!existedBefore) {
      const isDiscovered = atk.attackerSquare !== toSq;
      const attackerName = roleName(atk.attackerPiece.role);
      const targetName = roleName(atk.targetPiece.role);

      const desc = `${attackerName} on ${squareName(
        atk.attackerSquare
      )} attacks ${targetName.toLowerCase()} on ${squareName(atk.targetSquare)}`;

      if (isDiscovered) {
        result.discoveredAttacks.push(desc);
      } else {
        result.attacks.push(desc);
      }

      // Check if this is a check
      if (atk.targetPiece.role === "king") {
        result.checks.push(`${attackerName} on ${squareName(atk.attackerSquare)} gives check`);
      }
    }

    // Track hanging pieces (only count each target once)
    if (!seenTargets.has(atk.targetSquare)) {
      seenTargets.add(atk.targetSquare);
      const defenders = getDefenderCount(afterBoard, atk.targetSquare, enemyColor);
      if (defenders === 0 && atk.targetPiece.role !== "king") {
        const value = PIECE_VALUES[atk.targetPiece.role];
        result.hangingPieces.push(
          `${roleName(atk.targetPiece.role)} on ${squareName(atk.targetSquare)} is undefended (${value} pts)`
        );
        result.materialAtRisk = Math.max(result.materialAtRisk, value);
      }
    }
  }

  return result;
}

/**
 * Format threat info as a string for the LLM prompt
 */
export function formatThreatInfo(info: ThreatInfo): string {
  const lines: string[] = [];

  if (info.checks.length > 0) {
    lines.push(`♚ CHECK: ${info.checks.join(", ")}`);
  }

  if (info.attacks.length > 0) {
    lines.push(`⚔️ Attacks: ${info.attacks.join("; ")}`);
  }

  if (info.discoveredAttacks.length > 0) {
    lines.push(`💥 Discovered: ${info.discoveredAttacks.join("; ")}`);
  }

  if (info.hangingPieces.length > 0) {
    lines.push(`🎯 Hanging: ${info.hangingPieces.join("; ")}`);
  }

  return lines.length > 0 ? lines.join("\n") : "No immediate tactical threats";
}

const beforeFen = "r4rk1/ppq3pp/4pp2/2bp4/N2n4/P2Q3P/1PP2PP1/R1B1R1K1 w - - 5 19";
const afterFen = "r4rk1/ppq3pp/4pp2/2bp4/N2n4/P1PQ3P/1P3PP1/R1B1R1K1 b - - 0 19";
const uci = "c2c3";
const color = "white";

console.log(analyzeThreatDelta(beforeFen, afterFen, uci, color));
