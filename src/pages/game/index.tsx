import { useChesscomGame } from "@/api/queries";
import { Analysis } from "@/components/analysis";
import { Loader } from "@/components/Loader";
import { constructPgnFromChessComGame } from "@/helpers/pgn";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

export default function GamePage() {
  // Extract gameId from the URL path
  const gameId = useMemo(() => {
    const pathParts = window.location.pathname.split("/").filter(Boolean);

    // Find the gameId by looking for the first numeric string in the path
    // This handles both regular routes (/game/:gameId, /game/live/:gameId)
    // and redirected routes (/analysis/game/live/:gameId/analysis, /analysis/game/live/:gameId/review)
    return pathParts.find((part) => !isNaN(Number(part)) && Number(part) > 0);
  }, []);

  // Use React Query to fetch the game data
  const { data: gameResponse, isLoading, error } = useChesscomGame(gameId);

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Failed to load game:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load game",
      );
    }
  }, [error]);

  // Construct PGN from the game response
  const gameData = useMemo(() => {
    if (!gameResponse) return null;

    const pgn = constructPgnFromChessComGame(gameResponse);
    return {
      pgn,
      gameId: gameResponse.gameId,
    };
  }, [gameResponse]);

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (error || !gameId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-400">
          {error ? "Failed to load game" : "Invalid game ID"}
        </div>
      </div>
    );
  }

  if (!gameData) {
    return null;
  }

  return (
    <Analysis
      pgn={gameData.pgn}
      gameId={gameData.gameId}
      source="chesscom"
      boardOrientation="white"
    />
  );
}
