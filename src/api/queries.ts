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

// Chess.com games infinite query hook
export function useChesscomGamesInfinite(
  username: string | undefined | null,
  archives: string[],
  options?: Omit<
    UseInfiniteQueryOptions<UnifiedGame[], Error, InfiniteData<UnifiedGame[]>, any, number>,
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >
) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.chesscom.games(username || "", "infinite"), archives],
    queryFn: async ({ pageParam }) => {
      if (!archives.length || !username || pageParam < 0 || pageParam >= archives.length) return [];
      const archive = archives[pageParam];
      const games = await chesscomApi.getArchiveGames(archive, username);
      // Sort by timestamp descending (newest first)
      return games.sort((a, b) => b.timestamp - a.timestamp);
    },
    getNextPageParam: (_lastPage, _allPages, lastPageParam) => {
      // Move to previous archive (older games)
      const nextIndex = lastPageParam - 1;
      return nextIndex >= 0 ? nextIndex : undefined;
    },
    initialPageParam: archives.length - 1,
    enabled: !!username && archives.length > 0 && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

// Lichess games infinite query hook
export function useLichessGamesInfinite(
  username: string | undefined | null,
  gamesPerBatch: number,
  options?: Omit<
    UseInfiniteQueryOptions<UnifiedGame[], Error, InfiniteData<UnifiedGame[]>, any, number | null>,
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
