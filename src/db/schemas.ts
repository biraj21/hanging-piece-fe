import type { GameMoveInit } from "@/helpers/pgn";
import type { EngineMove } from "@/types";

export interface StockfishAnalysisDocument {
  gameId: string;
  depth: number;
  headers: Record<string, string>;
  moves: GameMoveInit[];
  timestamp: number;
}

export interface ExplanationDocument {
  gameId: string;
  moveIndex: number;
  explanation: string;
  badContinuation: Array<{ move: string; color?: string; reason: string }>;
  bestContinuation: Array<{ move: string; color?: string; reason: string }>;
  badLine: EngineMove[];
  bestLine: EngineMove[];
  timestamp: number;
}
