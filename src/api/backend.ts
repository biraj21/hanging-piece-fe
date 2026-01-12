import { env } from "@/config/env";
import type { BlackOrWhite, EngineEvaluation } from "@/types";

/**
 * Backend API functions
 */

interface UpdateProfilePayload {
  chesscomId?: string | null;
  lichessId?: string | null;
}

type MoveToSend = {
  san: string;
  uci: string;
  beforeFen: string;
  afterFen: string;
  color: string;
  evaluation?: EngineEvaluation;
};

export interface ExplainMovePayload {
  move: MoveToSend;
  moveQuality?: string;
  badContinuation: MoveToSend[];
  bestContinuation: MoveToSend[];
  userColor?: BlackOrWhite; // Color the user is playing as
  opening?: string;
  eco?: string;
  additionalContext?: string;
}

interface ExplainMoveResponse {
  explanation: string;
  badContinuation: Array<{ move: string; color: BlackOrWhite; reason: string }>;
  bestContinuation: Array<{ move: string; color: BlackOrWhite; reason: string }>;
}

export interface ChessComGameResponse {
  gameId: string;
  pgnHeaders: Record<string, string>;
  moves: Array<{
    from?: string;
    to: string;
    promotion?: string;
  }>;
}

export const backendApi = {
  /**
   * Fetch Chess.com game data
   */
  async getChessComGame(gameId: string): Promise<ChessComGameResponse> {
    const response = await fetch(`${env.VITE_API_BASE_URL}chesscom/${gameId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch game: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update user profile (chess accounts)
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<void> {
    const response = await fetch(`${env.VITE_API_BASE_URL}profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to update profile");
    }
  },

  /**
   * Get AI explanation for a chess move
   */
  async explainMove(payload: ExplainMovePayload): Promise<ExplainMoveResponse> {
    const response = await fetch(`${env.VITE_API_BASE_URL}explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to fetch explanation");
    }

    return response.json();
  },
};
