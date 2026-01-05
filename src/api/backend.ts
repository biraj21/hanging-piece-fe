import { env } from "@/config/env";
import type { BlackOrWhite } from "@/types";

/**
 * Backend API functions
 */

interface UpdateProfilePayload {
  chesscomId?: string | null;
  lichessId?: string | null;
}

type Continuation = Array<{
  san: string;
  uci: string;
  beforeFen: string;
  afterFen: string;
  color: string;
}>;

export interface ExplainMovePayload {
  color: BlackOrWhite;
  userColor?: BlackOrWhite; // Color the user is playing as
  moveQuality?: string;
  mate: number;
  move: {
    san: string;
    beforeFen: string;
    afterFen: string;
  };
  badContinuation: Continuation;
  bestContinuation: Continuation;
  opening?: string;
  eco?: string;
  additionalContext?: string;
}

interface ExplainMoveResponse {
  explanation: string;
  badContinuation: Array<{ move: string; color: BlackOrWhite; reason: string }>;
  bestContinuation: Array<{ move: string; color: BlackOrWhite; reason: string }>;
}

export const backendApi = {
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
