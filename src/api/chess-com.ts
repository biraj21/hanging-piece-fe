import type { UnifiedGame } from "@/types";

interface ChesscomGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  fen: string;
  time_class: string;
  white: {
    username: string;
    rating: number;
    result: string;
  };
  black: {
    username: string;
    rating: number;
    result: string;
  };
}

export interface ChesscomArchivesResponse {
  archives: string[];
}

export interface ChesscomGamesResponse {
  games: ChesscomGame[];
}

export interface ChesscomProfile {
  avatar?: string;
  username?: string;
  name?: string;
  country?: string;
  league?: string;
  followers?: number;
  url?: string;
}

export const chesscomApi = {
  /**
   * Fetch user profile from Chess.com
   */
  async getProfile(username: string): Promise<ChesscomProfile> {
    const response = await fetch(`https://api.chess.com/pub/player/${username}`);

    if (!response.ok) {
      throw new Error(`Chess.com profile not found: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      avatar: data.avatar,
      username: data.username,
      name: data.name,
      country: data.country ? data.country.split("/").pop() : undefined,
      league: data.league,
      followers: data.followers,
      url: data.url,
    };
  },

  /**
   * Fetch list of available monthly archives for a user
   */
  async getArchives(username: string): Promise<string[]> {
    const response = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Chess.com archives: ${response.statusText}`);
    }

    const data: ChesscomArchivesResponse = await response.json();
    return data.archives || [];
  },

  /**
   * Fetch games from a specific monthly archive
   */
  async getArchiveGames(archiveUrl: string, username: string): Promise<UnifiedGame[]> {
    const response = await fetch(archiveUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch Chess.com archive: ${response.statusText}`);
    }

    const data: ChesscomGamesResponse = await response.json();
    const games = data.games || [];

    return games.map((game) => {
      const userColor = game.white.username.toLowerCase() === username.toLowerCase() ? "white" : "black";
      const userResult = game[userColor].result;

      let result = "draw";
      if (userResult === "win") {
        result = "win";
      } else if (
        userResult === "checkmated" ||
        userResult === "resigned" ||
        userResult === "timeout" ||
        userResult === "abandoned"
      ) {
        result = "loss";
      }

      return {
        id: game.url,
        source: "chesscom" as const,
        white: { username: game.white.username, rating: game.white.rating },
        black: { username: game.black.username, rating: game.black.rating },
        result,
        timeControl: game.time_class || game.time_control,
        timestamp: game.end_time,
        url: game.url,
        pgn: game.pgn,
        rated: game.rated,
      };
    });
  },
};
