import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { backendApi } from "@/api/backend";
import { useChesscomProfile, useLichessProfile } from "@/api/queries";
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

  // Debounced setters for API queries
  const debouncedSetChesscomId = useDebounced(setChesscomIdForQuery, 500);
  const debouncedSetLichessId = useDebounced(setLichessIdForQuery, 500);

  // Fetch Chess.com profile with centralized hook (debounced)
  const {
    data: chesscomData,
    isLoading: isValidatingChesscom,
    isError: isChesscomError,
    isSuccess: isChesscomValid,
  } = useChesscomProfile(chesscomIdForQuery.trim() || null, {
    enabled: chesscomIdForQuery.trim().length > 0,
  });

  // Fetch Lichess profile with centralized hook (debounced)
  const {
    data: lichessData,
    isLoading: isValidatingLichess,
    isError: isLichessError,
    isSuccess: isLichessValid,
  } = useLichessProfile(lichessIdForQuery.trim() || null, {
    enabled: lichessIdForQuery.trim().length > 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one platform is provided
    const hasChesscom = chesscomId.trim() && isChesscomValid;
    const hasLichess = lichessId.trim() && isLichessValid;
    const canSubmit = hasChesscom || hasLichess;

    if (!canSubmit) {
      setError("Please provide at least one valid chess platform username (Chess.com or Lichess)");
      return;
    }

    if (chesscomId.trim() && (isValidatingChesscom || isChesscomError)) {
      setError("Please enter a valid Chess.com username");
      return;
    }

    if (lichessId.trim() && (isValidatingLichess || isLichessError)) {
      setError("Please enter a valid Lichess username");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await backendApi.updateProfile({
        chesscomId: chesscomId.trim() || null,
        lichessId: lichessId.trim() || null,
      });

      // Refresh session to get updated user data
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Connect Your Accounts</h1>
          <p className="text-neutral-400 text-sm">Add your Chess.com or Lichess username to analyze your games</p>
        </div>

        {/* Onboarding Form Card */}
        <div className="bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chess.com ID Input */}
            <div className="space-y-1.5">
              <label htmlFor="chesscomId" className="block text-left text-white text-xs font-medium">
                Chess.com Username
              </label>
              <input
                id="chesscomId"
                type="text"
                value={chesscomId}
                onChange={(e) => {
                  const value = e.target.value;
                  setChesscomId(value);
                  debouncedSetChesscomId(value);
                }}
                disabled={isSubmitting}
                placeholder="e.g., hikaru"
                className="w-full bg-neutral-800/50 border border-neutral-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:bg-neutral-800 disabled:cursor-not-allowed placeholder-neutral-500"
              />
              {isValidatingChesscom && (
                <p className="text-left text-neutral-400 text-xs flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                  Validating...
                </p>
              )}
              {chesscomId.trim() && !isValidatingChesscom && isChesscomValid && (
                <div className="space-y-2">
                  <p className="text-left text-green-400 text-xs font-medium">✓ Account found</p>
                  {chesscomData && (
                    <ProfilePreview
                      platform="chesscom"
                      avatar={chesscomData.avatar}
                      username={chesscomData.username || ""}
                      name={chesscomData.name}
                      country={chesscomData.country}
                      league={chesscomData.league}
                      url={chesscomData.url}
                    />
                  )}
                </div>
              )}
              {chesscomId.trim() && !isValidatingChesscom && isChesscomError && (
                <p className="text-left text-red-400 text-xs">✗ Username not found</p>
              )}
            </div>

            {/* Lichess ID Input */}
            <div className="space-y-1.5">
              <label htmlFor="lichessId" className="block text-left text-white text-xs font-medium">
                Lichess Username
              </label>
              <input
                id="lichessId"
                type="text"
                value={lichessId}
                onChange={(e) => {
                  const value = e.target.value;
                  setLichessId(value);
                  debouncedSetLichessId(value);
                }}
                disabled={isSubmitting}
                placeholder="e.g., DrNykterstein"
                className="w-full bg-neutral-800/50 border border-neutral-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:bg-neutral-800 disabled:cursor-not-allowed placeholder-neutral-500"
              />
              {isValidatingLichess && (
                <p className="text-left text-neutral-400 text-xs flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                  Validating...
                </p>
              )}
              {lichessId.trim() && !isValidatingLichess && isLichessValid && (
                <div className="space-y-2">
                  <p className="text-left text-green-400 text-xs font-medium">✓ Account found</p>
                  {lichessData && (
                    <ProfilePreview
                      platform="lichess"
                      username={lichessData.username || ""}
                      name={lichessData.name}
                      title={lichessData.title}
                      rating={lichessData.rating}
                      country={lichessData.country}
                      url={lichessData.url}
                    />
                  )}
                </div>
              )}
              {lichessId.trim() && !isValidatingLichess && isLichessError && (
                <p className="text-left text-red-400 text-xs">✗ Username not found</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting || isValidatingChesscom || isValidatingLichess}
                className="bg-white hover:bg-neutral-100 disabled:bg-neutral-600 disabled:cursor-not-allowed text-neutral-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
              >
                {isSubmitting ? "Saving..." : "Continue"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          You can add or update accounts later from your profile
        </p>
      </div>
    </div>
  );
}
