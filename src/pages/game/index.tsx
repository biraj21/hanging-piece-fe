import { useEffect, useState } from "react";
import { toast } from "sonner";

import { backendApi } from "@/api/backend";
import { Analysis } from "@/components/analysis";
import { Loader } from "@/components/Loader";
import { constructPgnFromChessComGame } from "@/helpers/pgn";

export default function GamePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameData, setGameData] = useState<{ pgn: string; gameId: string } | null>(null);

  useEffect(() => {
    const loadGame = async () => {
      try {
        const pathParts = window.location.pathname.split("/").filter(Boolean);
        const gameId = pathParts[pathParts.length - 1];

        if (!gameId || isNaN(Number(gameId))) {
          setError("Invalid game ID");
          setLoading(false);
          return;
        }

        const data = await backendApi.getChessComGame(gameId);
        const pgn = constructPgnFromChessComGame(data);

        setGameData({
          pgn,
          gameId: data.gameId,
        });
        setLoading(false);
      } catch (err) {
        console.error("Failed to load game:", err);
        toast.error(err instanceof Error ? err.message : "Failed to load game");
        setError("Failed to load game");
        setLoading(false);
      }
    };

    loadGame();
  }, []);

  if (loading) {
    return <Loader fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!gameData) {
    return null;
  }

  return <Analysis pgn={gameData.pgn} gameId={gameData.gameId} source="chesscom" boardOrientation="white" />;
}
