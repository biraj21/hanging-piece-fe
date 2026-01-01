export type BlackAndWhite = "white" | "black";

export type EngineLineMove = {
  san: string;
  from: string;
  to: string;
  fen: string;
};

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
