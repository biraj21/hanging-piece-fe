import {
  useChesscomArchives,
  useChesscomGamesInfinite,
  useLichessGamesInfinite,
} from "@/api/queries";
import { ProfilePreview } from "@/components/ProfilePreview";
import { useAuth } from "@/contexts/AuthContext";
import { getChessAccountUsername } from "@/helpers/chess-username";
import { parsePgnSimple, type ParsedPgnSimple } from "@/helpers/pgn";
import { ROUTES } from "@/router/routes";
import type { BlackOrWhite, UnifiedGame } from "@/types";
import {
  BarChart3Icon,
  ClockIcon,
  HandshakeIcon,
  SwordsIcon,
  TrophyIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

const GAMES_PER_BATCH = 20;

export default function GamesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeSource, setActiveSource] = useState<"chesscom" | "lichess">(
    () => {
      const platformParam = searchParams.get("platform");
      if (platformParam === "chesscom" || platformParam === "lichess") {
        return platformParam;
      }
      return user?.chesscomId ? "chesscom" : "lichess";
    },
  );
  const [resultFilter, setResultFilter] = useState<
    "all" | "win" | "loss" | "draw"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Update query params when platform changes
  useEffect(() => {
    setSearchParams({ platform: activeSource }, { replace: true });
  }, [activeSource, setSearchParams]);

  // Fetch Chess.com archives with centralized hook
  const { data: chesscomArchives = [], isLoading: isLoadingChesscomArchives } =
    useChesscomArchives(user?.chesscomId, {
      enabled: !!user?.chesscomId && activeSource === "chesscom",
    });

  // Fetch Chess.com games with infinite query
  const {
    data: chesscomGamesData,
    isLoading: isLoadingChesscom,
    fetchNextPage: fetchNextChesscomPage,
    hasNextPage: hasMoreChesscom,
    isFetchingNextPage: isFetchingMoreChesscom,
    error: chessComError,
  } = useChesscomGamesInfinite(user?.chesscomId, chesscomArchives, {
    enabled:
      !!user?.chesscomId &&
      chesscomArchives.length > 0 &&
      activeSource === "chesscom",
  });

  // Fetch Lichess games with infinite query
  const {
    data: lichessGamesData,
    isLoading: isLoadingLichess,
    fetchNextPage: fetchNextLichessPage,
    hasNextPage: hasMoreLichess,
    isFetchingNextPage: isFetchingMoreLichess,
    error: lichessError,
  } = useLichessGamesInfinite(user?.lichessId, GAMES_PER_BATCH, {
    enabled: !!user?.lichessId && activeSource === "lichess",
  });

  // Flatten all pages into a single array
  const chesscomGames: UnifiedGame[] =
    chesscomGamesData?.pages.flatMap((page) => page.games) ?? [];
  const lichessGames: UnifiedGame[] = lichessGamesData?.pages.flat() ?? [];

  if (chessComError) {
    console.error("chess.com error fetching games", chessComError);
  }

  if (lichessError) {
    console.error("lichess error fetching games", lichessError);
  }

  // Show games based on selected source
  const allGames = (
    activeSource === "chesscom" ? chesscomGames : lichessGames
  ).sort((a: UnifiedGame, b: UnifiedGame) => b.timestamp - a.timestamp);

  const isLoading =
    isLoadingChesscomArchives || isLoadingChesscom || isLoadingLichess;
  const hasMore =
    activeSource === "chesscom" ? hasMoreChesscom : hasMoreLichess;
  const isFetchingMore =
    activeSource === "chesscom"
      ? isFetchingMoreChesscom
      : isFetchingMoreLichess;

  const fetchMoreGames = () => {
    if (activeSource === "chesscom") {
      fetchNextChesscomPage();
    } else {
      fetchNextLichessPage();
    }
  };

  const handleAnalyzeGame = (game: UnifiedGame) => {
    // Determine which color the user played
    const userUsername = getChessAccountUsername(user!, activeSource);
    const isUserWhite = game.white.username.toLowerCase() === userUsername;
    const boardOrientation = isUserWhite ? "white" : "black";

    // Navigate to analysis page with game data
    navigate(ROUTES.ANALYSIS, {
      state: {
        pgn: game.pgn,
        gameId: game.id,
        source: game.source,
        boardOrientation,
      },
    });
  };

  // Filter games - first by search, then we'll filter by result separately for display
  const searchFilteredGames = allGames.filter((game) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        game.white.username.toLowerCase().includes(query) ||
        game.black.username.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Then apply result filter for display
  const filteredGames = searchFilteredGames.filter((game) => {
    if (resultFilter !== "all" && game.result !== resultFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen w-full text-white overflow-y-auto">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4 shrink-0">
        <h1 className="text-3xl font-bold text-white mb-2">My Games</h1>
      </div>

      {/* Stats and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 shrink-0">
        {/* Profile Preview */}
        <div className="mb-3">
          {activeSource === "chesscom" && user?.chesscomId && (
            <ProfilePreview platform="chesscom" username={user.chesscomId} />
          )}
          {activeSource === "lichess" && user?.lichessId && (
            <ProfilePreview platform="lichess" username={user.lichessId} />
          )}
        </div>

        {/* Source Dropdown and Search */}
        <div className="flex flex-wrap gap-2 mb-4">
          {user?.chesscomId && user?.lichessId && (
            <select
              value={activeSource}
              onChange={(e) =>
                setActiveSource(e.target.value as "chesscom" | "lichess")
              }
              className="px-3 py-2 bg-neutral-800 text-white text-sm rounded-lg border border-neutral-700 shrink-0"
            >
              <option value="chesscom">Chess.com</option>
              <option value="lichess">Lichess</option>
            </select>
          )}
          <input
            type="text"
            placeholder="Search opponent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[150px] px-4 py-2 bg-neutral-900/50 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
        </div>

        {/* Bottom Row: Result Filter */}
        <div className="flex gap-2 overflow-x-auto mb-4">
          <button
            onClick={() => setResultFilter("all")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
              resultFilter === "all"
                ? "bg-neutral-700 text-white"
                : "bg-neutral-900/50 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <span>All</span>
            <span className="text-xs opacity-60">
              ({searchFilteredGames.length})
            </span>
          </button>
          <button
            onClick={() => setResultFilter("win")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
              resultFilter === "win"
                ? "bg-green-500/20 border border-green-500/30 text-green-400"
                : "bg-neutral-900/50 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <TrophyIcon className="w-3.5 h-3.5" />
            <span>Wins</span>
            <span className="text-xs opacity-60">
              ({searchFilteredGames.filter((g) => g.result === "win").length})
            </span>
          </button>
          <button
            onClick={() => setResultFilter("loss")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
              resultFilter === "loss"
                ? "bg-red-500/20 border border-red-500/30 text-red-400"
                : "bg-neutral-900/50 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <XIcon className="w-3.5 h-3.5" />
            <span>Losses</span>
            <span className="text-xs opacity-60">
              ({searchFilteredGames.filter((g) => g.result === "loss").length})
            </span>
          </button>
          <button
            onClick={() => setResultFilter("draw")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
              resultFilter === "draw"
                ? "bg-neutral-500/20 border border-neutral-500/30 text-neutral-300"
                : "bg-neutral-900/50 border border-neutral-700/50 text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <HandshakeIcon className="w-3.5 h-3.5" />
            <span>Draws</span>
            <span className="text-xs opacity-60">
              ({searchFilteredGames.filter((g) => g.result === "draw").length})
            </span>
          </button>
        </div>

        {/* Games Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-neutral-600 border-t-white rounded-full animate-spin" />
              <p className="text-neutral-400">Loading your games...</p>
            </div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-neutral-400 text-lg mb-2">No games found</p>
              <p className="text-neutral-500 text-sm">
                Try adjusting your filters
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 shrink-0">
              {filteredGames.map((game) => (
                <Game
                  key={game.id}
                  userColor={
                    game.white.username.toLowerCase() ===
                    getChessAccountUsername(user!, activeSource)
                      ? "white"
                      : "black"
                  }
                  game={game}
                  onAnalyze={handleAnalyzeGame}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={fetchMoreGames}
                  disabled={isFetchingMore}
                  className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all text-sm"
                >
                  {isFetchingMore ? "Loading..." : "Load More Games"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const formatDate = (timestamp: number) => {
  // Lichess uses milliseconds, Chess.com uses seconds
  const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getResultBadgeColor = (result: string) => {
  switch (result) {
    case "win":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "loss":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "draw":
      return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
    default:
      return "bg-neutral-600/20 text-neutral-400 border-neutral-600/30";
  }
};

interface GameProps {
  userColor: BlackOrWhite;
  game: UnifiedGame;
  onAnalyze: (game: UnifiedGame) => void;
}

const Game: React.FC<GameProps> = ({ userColor, game, onAnalyze }) => {
  // Use opening field if available (Lichess), otherwise parse PGN (Chess.com)

  const infoFromPgn = useMemo(() => {
    let parsedGame: ParsedPgnSimple;
    let openingName: string | undefined;
    try {
      parsedGame = parsePgnSimple(game.pgn);

      const ECOUrl = parsedGame.headers.get("ECOUrl") || "";

      const openingsIndex = ECOUrl.lastIndexOf("/");

      if (openingsIndex > -1) {
        // Convert URL format to readable name
        // e.g., "Reti-Opening-1...d5" -> "Reti Opening"
        const urlPath = ECOUrl.substring(openingsIndex + 1);
        openingName = urlPath
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
          .replace(/\s+\d+\.+.*$/, "") // Remove move notation like "1...d5"
          .trim();
      }
    } catch (e) {
      console.error("error parsing PGN:", e);
      return {
        moveCount: 0,
        opening: undefined,
        timeControl: undefined,
      };
    }

    let timeControl = parsedGame.headers.get("TimeControl");
    const tcParts = (timeControl ? timeControl.split("+") : []).map((part) =>
      parseInt(part, 10),
    );
    if (tcParts.length === 2 && !isNaN(tcParts[0]) && !isNaN(tcParts[1])) {
      timeControl = `${Math.floor(tcParts[0] / 60)}+${tcParts[1]}`;
    } else {
      timeControl = undefined;
    }

    return {
      moveCount: Math.ceil(parsedGame.moveCount / 2),
      opening: openingName || parsedGame.headers.get("Opening"),
      timeControl: timeControl,
    };
  }, [game.pgn]);

  const opening = infoFromPgn.opening || game.opening?.name;
  const moveCount = infoFromPgn.moveCount;
  const timeControl = infoFromPgn.timeControl;

  return (
    <div
      key={game.id}
      className="bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-3 hover:border-neutral-600 transition-all hover:shadow-lg hover:shadow-black/20 group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <ClockIcon className="w-3 h-3" />
            <span>{game.timeControl}</span>
          </div>
          {timeControl && (
            <>
              <span className="text-xs text-neutral-600">•</span>
              <span className="text-xs text-neutral-500">{timeControl}</span>
            </>
          )}
          <span className="text-xs text-neutral-600">•</span>
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <SwordsIcon className="w-3 h-3" />
            <span>{moveCount}</span>
          </div>
        </div>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getResultBadgeColor(game.result)}`}
        >
          {game.result.toUpperCase()}
        </span>
      </div>

      {/* Players */}
      <div className="space-y-1.5 mb-4 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-white rounded-full" />
            <span
              className={`text-sm ${userColor === "white" ? "font-semibold text-white" : "text-neutral-300"}`}
            >
              {game.white.username}
              {userColor === "white" && (
                <span className="text-neutral-500 font-normal text-xs ml-1">
                  (you)
                </span>
              )}
            </span>
          </div>
          <span className="text-xs text-neutral-400">{game.white.rating}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full border border-neutral-500" />
            <span
              className={`text-sm ${userColor === "black" ? "font-semibold text-white" : "text-neutral-300"}`}
            >
              {game.black.username}
              {userColor === "black" && (
                <span className="text-neutral-500 font-normal text-xs ml-1">
                  (you)
                </span>
              )}
            </span>
          </div>
          <span className="text-xs text-neutral-400">{game.black.rating}</span>
        </div>
      </div>

      {/* Opening */}
      <div className="my-3 px-1">
        <p className="text-xs text-neutral-400 truncate">{opening}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-700/50">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <div>{formatDate(game.timestamp)}</div>
        </div>
        <button
          onClick={() => onAnalyze(game)}
          className="flex items-center gap-1.5 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded-lg transition group-hover:bg-neutral-600"
        >
          <BarChart3Icon className="w-3.5 h-3.5" />
          <span>Analyze</span>
        </button>
      </div>
    </div>
  );
};
