import type { Table } from "dexie";
import Dexie from "dexie";

import type { ExplanationDocument, StockfishAnalysisDocument } from "./schemas";

class AnalysisDatabase extends Dexie {
  stockfishAnalysis!: Table<StockfishAnalysisDocument, [string, number]>;
  explanations!: Table<ExplanationDocument, [string, number]>;

  constructor() {
    super("hp_analysis_cache");
    this.version(1).stores({
      stockfishAnalysis: "[gameId+depth], timestamp",
      explanations: "[gameId+moveIndex], timestamp",
    });
  }
}

export const analysysDb = new AnalysisDatabase();
