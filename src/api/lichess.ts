import type { UnifiedGame } from "@/types";

interface LichessGame {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  players: {
    white: {
      user: { name: string; id: string };
      rating?: number;
    };
    black: {
      user: { name: string; id: string };
      rating?: number;
    };
  };
  winner?: "white" | "black";
  pgn?: string;
  opening?: {
    eco: string;
    name: string;
    ply: number;
  };
}

export interface LichessProfile {
  username?: string;
  name?: string;
  title?: string;
  rating?: number;
  country?: string;
  url?: string;
}

export const lichessApi = {
  /**
   * Fetch user profile from Lichess
   */
  async getProfile(username: string): Promise<LichessProfile> {
    const response = await fetch(`https://lichess.org/api/user/${username}`);

    if (!response.ok) {
      throw new Error(`Lichess profile not found: ${response.statusText}`);
    }

    const data = await response.json();

    // Get the highest rating from perfs (prefer non-provisional ratings)
    const perfs = data.perfs || {};
    const ratings = Object.values(perfs)
      .map((perf: any) => (perf.prov ? null : perf.rating)) // eslint-disable-line @typescript-eslint/no-explicit-any
      .filter((rating): rating is number => rating !== null && rating !== undefined);
    const highestRating = ratings.length > 0 ? Math.max(...ratings) : undefined;

    return {
      username: data.username,
      name: data.profile?.realName,
      title: data.title,
      rating: highestRating,
      country: data.profile?.flag,
      url: data.url || `https://lichess.org/@/${data.username}`,
    };
  },
  /**
   * Fetch a batch of games for a user
   * @param username - Lichess username
   * @param untilTimestamp - Optional timestamp to paginate (fetch games before this timestamp)
   * @param max - Maximum number of games to fetch
   */
  async getGames(username: string, untilTimestamp: number | null = null, max: number = 20): Promise<UnifiedGame[]> {
    const url = new URL(`https://lichess.org/api/games/user/${username}`);
    url.searchParams.set("max", max.toString());
    url.searchParams.set("pgnInJson", "true");
    url.searchParams.set("sort", "dateDesc");
    url.searchParams.set("evals", "true");
    url.searchParams.set("literate", "true");
    url.searchParams.set("opening", "true");

    if (untilTimestamp) {
      url.searchParams.set("until", untilTimestamp.toString());
    }

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/x-ndjson" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Lichess games: ${response.statusText}`);
    }

    const text = await response.text();
    if (!text.trim()) {
      return [];
    }

    const lines = text.trim().split("\n");
    const lichessGames: LichessGame[] = lines.map((line) => JSON.parse(line));

    return lichessGames.map((game) => {
      const userColor = game.players.white.user.id.toLowerCase() === username.toLowerCase() ? "white" : "black";

      let result = "draw";
      if (game.winner) {
        result = game.winner === userColor ? "win" : "loss";
      }

      return {
        id: game.id,
        source: "lichess" as const,
        white: {
          username: game.players.white.user.name,
          rating: game.players.white.rating || 0,
        },
        black: {
          username: game.players.black.user.name,
          rating: game.players.black.rating || 0,
        },
        result,
        timeControl: game.speed,
        timestamp: game.createdAt,
        url: `https://lichess.org/${game.id}`,
        pgn: game.pgn || "",
        rated: game.rated,
        opening: game.opening,
      };
    });
  },
};
