import { env } from "@/config/env";

/**
 * Backend API functions
 */

interface UpdateProfilePayload {
  chesscomId?: string | null;
  lichessId?: string | null;
}

type Continuation = {
  pgn: string;
  beforeFen: string;
  afterFen: string;
  color: string;
};

interface ExplainMovePayload {
  color: string;
  moveQuality?: string;
  mate: number;
  move: {
    pgn: string;
    beforeFen: string;
    afterFen: string;
  };
  badContinuation: Array<Continuation>;
  bestContinuation: Array<Continuation>;
  opening?: string;
  eco?: string;
  additionalContext?: string;
}

interface ExplainMoveResponse {
  explanation: string;
  badContinuation?: Array<{ move: string; color?: string; reason: string }>;
  bestContinuation?: Array<{ move: string; color?: string; reason: string }>;
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
