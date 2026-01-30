import type { ParsedGame } from "@/helpers/pgn";
import { GameMove } from "@/helpers/pgn";
import { analysysDb } from "./index";

export class StockfishAnalysis {
  static async findOne(gameId: string, depth: number): Promise<ParsedGame | null> {
    try {
      const doc = await analysysDb.stockfishAnalysis.get([gameId, depth]);
      if (!doc) {
        return null;
      }

      return {
        headers: new Map(Object.entries(doc.headers)),
        moves: doc.moves.map((m) => new GameMove(m)),
      };
    } catch (error) {
      console.error("Failed to retrieve analysis from cache:", error);
      return null;
    }
  }

  static async create(gameId: string, depth: number, game: ParsedGame): Promise<void> {
    try {
      await analysysDb.stockfishAnalysis.put({
        gameId,
        depth,
        headers: Object.fromEntries(game.headers),
        moves: game.moves.map((m) => ({
          ply: m.ply,
          san: m.san,
          fen: m.fen,
          from: m.from,
          to: m.to,
          uci: m.uci,
          textComments: m.textComments,
          evaluation: m.evaluation,
          nags: m.nags,
          clock: m.clock,
          variations: m.variations,
        })),
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to store analysis in cache:", error);
    }
  }

  static async deleteOlderThan(days: number = 7): Promise<number> {
    try {
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      return await analysysDb.stockfishAnalysis.where("timestamp").below(cutoffTime).delete();
    } catch (error) {
      console.error("Failed to clean old analysis:", error);
      return 0;
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await analysysDb.stockfishAnalysis.clear();
    } catch (error) {
      console.error("Failed to clear analysis cache:", error);
      throw error;
    }
  }
}
