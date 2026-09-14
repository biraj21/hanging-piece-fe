import { Analysis } from "@/components/analysis";
import { useLocation } from "react-router";

export default function AnalysisPage() {
  const location = useLocation();
  const state = location.state as {
    pgn?: string;
    gameId?: string;
    source?: "chesscom" | "lichess";
    boardOrientation?: "white" | "black";
  } | null;

  return (
    <Analysis
      pgn={state?.pgn}
      gameId={state?.gameId}
      source={state?.source || "pgn"}
      boardOrientation={state?.boardOrientation || "white"}
    />
  );
}
