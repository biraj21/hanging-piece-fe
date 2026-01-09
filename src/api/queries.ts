import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

import type { UnifiedGame } from "@/types";

import { chesscomApi, type ChesscomProfile } from "./chess-com";
import { lichessApi, type LichessProfile } from "./lichess";

/**
 * Query key factories for consistent caching across the app
 * Using factory pattern ensures query keys are consistent everywhere
 */
export const queryKeys = {
  // Chess.com query keys
  chesscom: {
    all: ["chesscom"] as const,
    profile: (username: string) => ["chesscom", "profile", username] as const,
    archives: (username: string) => ["chesscom", "archives", username] as const,
    games: (username: string, archive?: string) => ["chesscom", "games", username, archive] as const,
  },

  // Lichess query keys
  lichess: {
    all: ["lichess"] as const,
    profile: (username: string) => ["lichess", "profile", username] as const,
    games: (username: string, until?: number | null) => ["lichess", "games", username, until] as const,
  },
} as const;

// Session storage key for tracking empty archives
const EMPTY_ARCHIVES_KEY = "chesscom_empty_archives";

// Helper functions for session storage management
function getEmptyArchives(username: string): Set<string> {
  try {
    const stored = sessionStorage.getItem(`${EMPTY_ARCHIVES_KEY}_${username}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function addEmptyArchive(username: string, archive: string): void {
  try {
    const emptyArchives = getEmptyArchives(username);
    emptyArchives.add(archive);
    sessionStorage.setItem(`${EMPTY_ARCHIVES_KEY}_${username}`, JSON.stringify([...emptyArchives]));
  } catch {
    // Ignore session storage errors
  }
}

/**
 * Centralized React Query hooks for consistent data fetching
 */

// Chess.com profile query hook
export function useChesscomProfile(
  username: string | undefined | null,
  options?: Omit<UseQueryOptions<ChesscomProfile, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.chesscom.profile(username || ""),
    queryFn: () => chesscomApi.getProfile(username!),
    enabled: !!username && (options?.enabled ?? true),
    retry: false,
    staleTime: 1000 * 60 * 60, // 1 hour
    ...options,
  });
}

// Lichess profile query hook
export function useLichessProfile(
  username: string | undefined | null,
  options?: Omit<UseQueryOptions<LichessProfile, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.lichess.profile(username || ""),
    queryFn: () => lichessApi.getProfile(username!),
    enabled: !!username && (options?.enabled ?? true),
    retry: false,
    staleTime: 1000 * 60 * 60, // 1 hour
    ...options,
  });
}

// Chess.com archives query hook
export function useChesscomArchives(
  username: string | undefined | null,
  options?: Omit<UseQueryOptions<string[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.chesscom.archives(username || ""),
    queryFn: () => chesscomApi.getArchives(username!),
    enabled: !!username && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 60, // 1 hour
    ...options,
  });
}

// Type for the data returned by the query function
type ChesscomGamesPage = {
  games: UnifiedGame[];
  archiveIndex: number; // The actual archive index that was loaded
};

// Chess.com games infinite query hook
export function useChesscomGamesInfinite(
  username: string | undefined | null,
  archives: string[],
  options?: Omit<
    UseInfiniteQueryOptions<ChesscomGamesPage, Error, InfiniteData<ChesscomGamesPage>, any, number>, // eslint-disable-line @typescript-eslint/no-explicit-any
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >
) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.chesscom.games(username || "", "infinite"), archives],
    queryFn: async ({ pageParam }): Promise<ChesscomGamesPage> => {
      if (!archives.length || !username || pageParam < 0 || pageParam >= archives.length) {
        return { games: [], archiveIndex: -1 };
      }

      const emptyArchives = getEmptyArchives(username);

      // Try archives starting from the current pageParam, working backwards until we find games
      // Skip over known empty archives
      let currentIndex = pageParam;
      while (currentIndex >= 0) {
        const archive = archives[currentIndex];

        // Skip this archive if we know it's empty from session storage
        if (emptyArchives.has(archive)) {
          currentIndex--;
          continue;
        }

        const games = await chesscomApi.getArchiveGames(archive, username);
        if (games.length > 0) {
          // Found games! Return them sorted by timestamp descending (newest first)
          return {
            games: games.sort((a, b) => b.timestamp - a.timestamp),
            archiveIndex: currentIndex,
          };
        }

        // Archive was empty, remember it and try the next older one
        addEmptyArchive(username, archive);
        currentIndex--;
      }

      // All archives from this point backwards were empty
      return { games: [], archiveIndex: -1 };
    },
    getNextPageParam: (lastPage, _allPages, _lastPageParam) => {
      // Use the actual archive index that was loaded, not the pageParam
      const nextIndex = lastPage.archiveIndex - 1;
      return nextIndex >= 0 ? nextIndex : undefined;
    },
    initialPageParam: archives.length - 1,
    enabled: !!username && archives.length > 0 && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 15, // 15 minutes
    ...options,
  });
}

// Lichess games infinite query hook
export function useLichessGamesInfinite(
  username: string | undefined | null,
  gamesPerBatch: number,
  options?: Omit<
    UseInfiniteQueryOptions<UnifiedGame[], Error, InfiniteData<UnifiedGame[]>, any, number | null>, // eslint-disable-line @typescript-eslint/no-explicit-any
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >
) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.lichess.games(username || "", null), "infinite"],
    queryFn: async ({ pageParam }) => {
      if (!username) return [];
      return lichessApi.getGames(username, pageParam, gamesPerBatch);
    },
    getNextPageParam: (lastPage) => {
      // Use the timestamp of the oldest game minus 1ms to avoid duplicates
      // (Lichess might have multiple games with the same timestamp)
      if (lastPage.length < gamesPerBatch) return undefined;
      const lastTimestamp = lastPage[lastPage.length - 1]?.timestamp;
      return lastTimestamp ? lastTimestamp - 1 : undefined;
    },
    initialPageParam: null as number | null,
    enabled: !!username && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}
