import type { ChesscomProfileWithStats } from "@/api/chess-com";
import type { LichessProfile } from "@/api/lichess";
import { useChesscomProfile, useLichessProfile } from "@/api/queries";
import clsx from "clsx";
import { useEffect } from "react";

import { PlayOnPlatform } from "./PlayOnPlatform";

interface ProfilePreviewProps {
  platform: "chesscom" | "lichess";
  username: string;
  onLoad?: (data: ChesscomProfileWithStats | LichessProfile) => void;
  onError?: (error: Error) => void;
  showPlayButton?: boolean;
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({
  platform,
  username,
  onLoad,
  onError,
  showPlayButton = true,
}) => {
  username = username.trim();
  const isChesscom = platform === "chesscom";
  const shouldFetch = !!username;

  const chesscomQuery = useChesscomProfile(username || undefined, {
    enabled: shouldFetch && isChesscom,
  });
  const lichessQuery = useLichessProfile(username || undefined, {
    enabled: shouldFetch && !isChesscom,
  });

  const data = isChesscom ? chesscomQuery.data : lichessQuery.data;
  const isLoading = isChesscom
    ? chesscomQuery.isLoading
    : lichessQuery.isLoading;
  const isError = isChesscom ? chesscomQuery.isError : lichessQuery.isError;
  const error = !shouldFetch
    ? null
    : isChesscom
      ? chesscomQuery.error
      : lichessQuery.error;

  const chesscomData = chesscomQuery.data;
  const lichessData = lichessQuery.data;

  useEffect(() => {
    if (data && !isLoading && !isError) {
      onLoad?.(data);
    }
  }, [data, isLoading, isError, onLoad]);

  useEffect(() => {
    if (isError && error) {
      onError?.(error);
    }
  }, [isError, error, onError]);

  const displayName = isChesscom
    ? chesscomData?.name || username
    : lichessData?.name || username;
  const avatar = isChesscom ? chesscomData?.avatar : undefined;
  const country = isChesscom ? chesscomData?.country : lichessData?.country;
  const league = isChesscom ? chesscomData?.league : undefined;
  const title = isChesscom ? undefined : lichessData?.title;
  const rating = isChesscom ? chesscomData?.stats?.rating : lichessData?.rating;

  const stats = isChesscom
    ? chesscomData?.stats
    : lichessData?.games
      ? {
          wins: lichessData.games.wins,
          losses: lichessData.games.losses,
          draws: lichessData.games.draws,
        }
      : undefined;

  const totalGames = stats ? stats.wins + stats.losses + stats.draws : 0;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  if (!username) {
    return null;
  }

  if (isError && error) {
    return (
      <div className="flex items-center gap-3 py-1.5">
        <p className="text-xs text-red-400">Username not found</p>
      </div>
    );
  }

  return (
    <div className="py-1.5">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full shrink-0 border border-neutral-700 flex items-center justify-center ${
            isLoading ? "bg-neutral-700 animate-pulse" : ""
          }`}
        >
          {!isLoading && avatar ? (
            <img
              src={avatar}
              alt={`${username}'s avatar`}
              className="w-full h-full rounded-full object-cover"
            />
          ) : !isLoading && !avatar ? (
            <span className="text-white text-xs font-semibold">
              {getInitials(displayName)}
            </span>
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isLoading ? (
              <div className="h-4 w-24 bg-neutral-700 rounded animate-pulse" />
            ) : (
              <h3 className="text-white text-sm font-semibold truncate">
                {displayName}
              </h3>
            )}
            {isLoading ? (
              <div className="h-4 w-12 bg-neutral-700 rounded animate-pulse" />
            ) : (
              title && (
                <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  {title}
                </span>
              )
            )}
            {isLoading ? (
              <div className="h-4 w-16 bg-neutral-700 rounded animate-pulse" />
            ) : (
              league && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold">
                  {league}
                </span>
              )
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-neutral-400 mt-0.5">
            {isLoading ? (
              <>
                <div className="h-3 w-20 bg-neutral-700 rounded animate-pulse" />
                <div className="h-3 w-10 bg-neutral-700 rounded animate-pulse" />
                <div className="h-3 w-8 bg-neutral-700 rounded animate-pulse" />
              </>
            ) : (
              <>
                <span>@{username}</span>
                {rating !== undefined && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-white">{rating}</span>
                  </>
                )}
                {country && (
                  <>
                    <span>•</span>
                    <span className="uppercase">{country}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {showPlayButton && !isLoading && <PlayOnPlatform platform={platform} />}
      </div>
      {
        <div
          className={clsx("text-[10px] text-neutral-500 mt-1", {
            "bg-neutral-700 rounded animate-pulse": isLoading,
          })}
        >
          <div
            className={clsx("flex items-center gap-2", {
              "opacity-0": isLoading,
            })}
          >
            <span>{totalGames.toLocaleString()} games</span>
            <span className="text-green-400/70">
              {stats?.wins.toLocaleString()}W
            </span>
            <span className="text-red-400/70">
              {stats?.losses.toLocaleString()}L
            </span>
            <span className="text-neutral-400/70">
              {stats?.draws.toLocaleString()}D
            </span>
          </div>
        </div>
      }
    </div>
  );
};
