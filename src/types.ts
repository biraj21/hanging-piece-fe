export type BlackOrWhite = "white" | "black";

/**
 * A unified game type that can be used for both Chess.com and Lichess.
 */
export type UnifiedGame = {
  id: string;
  source: "chesscom" | "lichess";
  white: { username: string; rating: number };
  black: { username: string; rating: number };
  result: string;
  timeControl: string;
  timestamp: number;
  url: string;
  pgn: string;
  rated: boolean;
  opening?: {
    eco: string;
    name: string;
    ply?: number;
  };
};

export type EngineMateEval = { mate: number };
export type EngineCentipawnEval = { cp: number };
export type EngineEvaluation = EngineMateEval | EngineCentipawnEval;

export type EngineMove = {
  san: string;
  from: string;
  to: string;
  fen: string;
  evaluation?: EngineEvaluation;
};

export type Explanation = {
  explanation: string;
  badContinuation: Array<{ move: string; color?: string; reason: string }>;
  bestContinuation: Array<{ move: string; color?: string; reason: string }>;
  badLine: EngineMove[];
  bestLine: EngineMove[];
};
