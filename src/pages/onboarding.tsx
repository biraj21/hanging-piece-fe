import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { backendApi } from "@/api/backend";
import { useDebounced } from "@/components/hooks/use-debounced";
import { ProfilePreview } from "@/components/ProfilePreview";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/router/routes";

export default function OnboardingPage() {
  const { user, refreshSession } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [chesscomId, setChesscomId] = useState(user?.chesscomId || "");
  const [lichessId, setLichessId] = useState(user?.lichessId || "");
  const [chesscomIdForQuery, setChesscomIdForQuery] = useState(user?.chesscomId || "");
  const [lichessIdForQuery, setLichessIdForQuery] = useState(user?.lichessId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSetChesscomId = useDebounced(setChesscomIdForQuery, 500);
  const debouncedSetLichessId = useDebounced(setLichessIdForQuery, 500);

  const [chesscomValid, setChesscomValid] = useState(false);
  const [lichessValid, setLichessValid] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const chessComTrimmed = chesscomId.trim();
    const lichessTrimmed = lichessId.trim();

    if (!chessComTrimmed && !lichessTrimmed) {
      setError("Please provide at least one valid chess platform username");
      return;
    }

    if (chessComTrimmed && !chesscomValid) {
      setError("Please provide a valid Chess.com username");
      return;
    }

    if (lichessTrimmed && !lichessValid) {
      setError("Please provide a valid Lichess username");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await backendApi.updateProfile({
        chesscomId: chesscomId.trim() || null,
        lichessId: lichessId.trim() || null,
      });

      await refreshSession();
      navigate(state.redirectTo || ROUTES.DASHBOARD);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-800 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Connect Your Chess Accounts</h1>
          <p className="text-neutral-400 text-sm">Add your Chess.com and/or Lichess username to analyze your games</p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="chesscomId" className="block text-left text-white text-xs font-medium">
                  Chess.com Username
                </label>
                <span className="text-[10px] text-neutral-500">Optional</span>
              </div>
              <input
                id="chesscomId"
                type="text"
                value={chesscomId}
                onChange={(e) => {
                  setChesscomId(e.target.value);
                  debouncedSetChesscomId(e.target.value);
                }}
                disabled={isSubmitting}
                placeholder="e.g., hikaru"
                className="w-full bg-neutral-800/50 border border-neutral-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:bg-neutral-800 disabled:cursor-not-allowed placeholder-neutral-500"
              />
              {chesscomIdForQuery.trim() && (
                <ProfilePreview
                  platform="chesscom"
                  username={chesscomIdForQuery.trim()}
                  onLoad={() => setChesscomValid(true)}
                  onError={() => setChesscomValid(false)}
                  showPlayButton={false}
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-700" />
              <span className="text-xs text-neutral-500 whitespace-nowrap">add one or both</span>
              <div className="flex-1 h-px bg-neutral-700" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="lichessId" className="block text-left text-white text-xs font-medium">
                  Lichess Username
                </label>
                <span className="text-[10px] text-neutral-500">Optional</span>
              </div>
              <input
                id="lichessId"
                type="text"
                value={lichessId}
                onChange={(e) => {
                  setLichessId(e.target.value);
                  debouncedSetLichessId(e.target.value);
                }}
                disabled={isSubmitting}
                placeholder="e.g., DrNykterstein"
                className="w-full bg-neutral-800/50 border border-neutral-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:bg-neutral-800 disabled:cursor-not-allowed placeholder-neutral-500"
              />
              {lichessIdForQuery.trim() && (
                <ProfilePreview
                  platform="lichess"
                  username={lichessIdForQuery.trim()}
                  onLoad={() => setLichessValid(true)}
                  onError={() => setLichessValid(false)}
                  showPlayButton={false}
                />
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-white hover:bg-neutral-100 disabled:bg-neutral-600 disabled:cursor-not-allowed text-neutral-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
              >
                {isSubmitting ? "Saving..." : "Continue"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-500 mt-6">
          You can add or update accounts later from your profile
        </p>
      </div>
    </div>
  );
}
