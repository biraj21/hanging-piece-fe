import type { Explanation } from "@/types";
import { analysysDb } from "./index";

export class ExplanationModel {
  static async findOne(gameId: string, moveIndex: number): Promise<Explanation | null> {
    try {
      const doc = await analysysDb.explanations.get([gameId, moveIndex]);
      if (!doc) {
        return null;
      }

      return {
        explanation: doc.explanation,
        badContinuation: doc.badContinuation,
        bestContinuation: doc.bestContinuation,
        badLine: doc.badLine,
        bestLine: doc.bestLine,
      };
    } catch (error) {
      console.error("Failed to retrieve explanation from cache:", error);
      return null;
    }
  }

  static async create(gameId: string, moveIndex: number, data: Explanation): Promise<void> {
    try {
      await analysysDb.explanations.put({
        gameId,
        moveIndex,
        ...data,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to store explanation in cache:", error);
    }
  }

  static async deleteOlderThan(days: number = 7): Promise<number> {
    try {
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      return await analysysDb.explanations.where("timestamp").below(cutoffTime).delete();
    } catch (error) {
      console.error("Failed to clean old explanations:", error);
      return 0;
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await analysysDb.explanations.clear();
    } catch (error) {
      console.error("Failed to clear explanation cache:", error);
      throw error;
    }
  }
}
