import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Logo } from "@/components/Logo";
import { ProfilePreview } from "@/components/ProfilePreview";
import { env } from "@/config/env";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/router/routes";

const DEBOUNCE_MS = 500;

export default function OnboardingPage() {
  const { user, refreshSession } = useAuth();
  const navigate = useNavigate();

  const [chesscomId, setChesscomId] = useState(user?.chesscomId || "");
  const [lichessId, setLichessId] = useState(user?.lichessId || "");
  const [isChesscomValid, setIsChesscomValid] = useState(false);
  const [isLichessValid, setIsLichessValid] = useState(false);
  const [isValidatingChesscom, setIsValidatingChesscom] = useState(false);
  const [isValidatingLichess, setIsValidatingLichess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chesscomData, setChesscomData] = useState<{
    avatar?: string;
    username?: string;
    name?: string;
    country?: string;
    league?: string;
    followers?: number;
    url?: string;
  } | null>(null);
  const [lichessData, setLichessData] = useState<{
    username?: string;
    name?: string;
    title?: string;
    rating?: number;
    country?: string;
    url?: string;
  } | null>(null);

  // Refs to track abort controllers for cancelling in-flight requests
  const chesscomAbortRef = useRef<AbortController | null>(null);
  const lichessAbortRef = useRef<AbortController | null>(null);

  // Debounced Chess.com validation
  useEffect(() => {
    const trimmedId = chesscomId.trim();

    // Reset state if empty
    if (!trimmedId) {
      setIsChesscomValid(false);
      setChesscomData(null);
      setIsValidatingChesscom(false);
      return;
    }

    // Mark as validating immediately for UI feedback
    setIsValidatingChesscom(true);
    setIsChesscomValid(false);
    setChesscomData(null);

    const timeoutId = setTimeout(async () => {
      // Abort any previous request
      chesscomAbortRef.current?.abort();
      const controller = new AbortController();
      chesscomAbortRef.current = controller;

      try {
        const response = await fetch(`https://api.chess.com/pub/player/${trimmedId}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setIsChesscomValid(true);
          setChesscomData({
            avatar: data.avatar,
            username: data.username,
            name: data.name,
            country: data.country ? data.country.split("/").pop() : undefined,
            league: data.league,
            followers: data.followers,
            url: data.url,
          });
          setError(null);
        } else {
          setIsChesscomValid(false);
          setChesscomData(null);
          setError("Chess.com username not found");
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("Error validating Chess.com ID:", err);
        setIsChesscomValid(false);
        setChesscomData(null);
        setError("Failed to validate Chess.com username");
      } finally {
        if (!controller.signal.aborted) {
          setIsValidatingChesscom(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      chesscomAbortRef.current?.abort();
    };
  }, [chesscomId]);

  // Debounced Lichess validation
  useEffect(() => {
    const trimmedId = lichessId.trim();

    // Reset state if empty
    if (!trimmedId) {
      setIsLichessValid(false);
      setLichessData(null);
      setIsValidatingLichess(false);
      return;
    }

    // Mark as validating immediately for UI feedback
    setIsValidatingLichess(true);
    setIsLichessValid(false);
    setLichessData(null);

    const timeoutId = setTimeout(async () => {
      // Abort any previous request
      lichessAbortRef.current?.abort();
      const controller = new AbortController();
      lichessAbortRef.current = controller;

      try {
        const response = await fetch(`https://lichess.org/api/user/${trimmedId}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();

          // Get the highest rating from perfs (prefer non-provisional ratings)
          const perfs = data.perfs || {};
          const ratings = Object.values(perfs)
            .map((perf: any) => (perf.prov ? null : perf.rating))
            .filter((rating): rating is number => rating !== null && rating !== undefined);
          const highestRating = ratings.length > 0 ? Math.max(...ratings) : undefined;

          setIsLichessValid(true);
          setLichessData({
            username: data.username,
            name: data.profile?.realName,
            title: data.title,
            rating: highestRating,
            country: data.profile?.flag,
            url: data.url || `https://lichess.org/@/${data.username}`,
          });
          setError(null);
        } else {
          setIsLichessValid(false);
          setLichessData(null);
          setError("Lichess username not found");
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("Error validating Lichess ID:", err);
        setIsLichessValid(false);
        setLichessData(null);
        setError("Failed to validate Lichess username");
      } finally {
        if (!controller.signal.aborted) {
          setIsValidatingLichess(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      lichessAbortRef.current?.abort();
    };
  }, [lichessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one platform is provided
    const hasChesscom = chesscomId.trim() && isChesscomValid;
    const hasLichess = lichessId.trim() && isLichessValid;

    if (!hasChesscom && !hasLichess) {
      setError("Please provide at least one valid chess platform username (Chess.com or Lichess)");
      return;
    }

    if (chesscomId.trim() && !isChesscomValid) {
      setError("Please enter a valid Chess.com username");
      return;
    }

    if (lichessId.trim() && !isLichessValid) {
      setError("Please enter a valid Lichess username");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${env.VITE_API_BASE_URL}profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          chesscomId: chesscomId.trim() || null,
          lichessId: lichessId.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Refresh session to get updated user data
      await refreshSession();
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enable submit if:
  // 1. Chess.com ID is provided and validated successfully, OR
  // 2. Lichess ID is provided and validated successfully, OR
  // 3. Both are provided (both must be valid if provided)
  const hasChesscom = chesscomId.trim() && isChesscomValid;
  const hasLichess = lichessId.trim() && isLichessValid;
  const canSubmit = hasChesscom || hasLichess;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-800 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center">
          {/* Logo/Brand */}
          <Logo className="mb-8" />

          <div className="text-neutral-300 text-sm mb-4 text-center">
            Welcome! Let's connect your chess accounts to get started.
            <span className="block text-neutral-400 text-xs mt-1">
              Add your Chess.com or Lichess username (or both if you play on multiple platforms).
            </span>
          </div>
        </div>

        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chess.com ID Input */}
          <div className="space-y-1.5">
            <label htmlFor="chesscomId" className="block text-left text-neutral-300 text-xs font-medium">
              Chess.com Username
            </label>
            <input
              id="chesscomId"
              type="text"
              value={chesscomId}
              onChange={(e) => setChesscomId(e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter your Chess.com username"
              className="w-full bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white disabled:bg-neutral-600 disabled:cursor-not-allowed"
            />
            {isValidatingChesscom && <p className="text-left text-neutral-400 text-xs">Validating...</p>}
            {chesscomId.trim() && !isValidatingChesscom && isChesscomValid && (
              <div className="space-y-1.5">
                <p className="text-left text-green-400 text-xs">✓ Valid</p>
                {chesscomData && (
                  <ProfilePreview
                    platform="chesscom"
                    avatar={chesscomData.avatar}
                    username={chesscomData.username || ""}
                    name={chesscomData.name}
                    country={chesscomData.country}
                    league={chesscomData.league}
                    followers={chesscomData.followers}
                    url={chesscomData.url}
                  />
                )}
              </div>
            )}
          </div>

          {/* Lichess ID Input */}
          <div className="space-y-1.5">
            <label htmlFor="lichessId" className="block text-left text-neutral-300 text-xs font-medium">
              Lichess Username
            </label>
            <input
              id="lichessId"
              type="text"
              value={lichessId}
              onChange={(e) => setLichessId(e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter your Lichess username"
              className="w-full bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white disabled:bg-neutral-600 disabled:cursor-not-allowed"
            />
            {isValidatingLichess && <p className="text-left text-neutral-400 text-xs">Validating...</p>}
            {lichessId.trim() && !isValidatingLichess && isLichessValid && (
              <div className="space-y-1.5">
                <p className="text-left text-green-400 text-xs">✓ Valid</p>
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
          </div>

          {/* Error Message */}
          {error && <div className="text-red-400 text-xs text-left">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting || isValidatingChesscom || isValidatingLichess}
            className="bg-white hover:bg-neutral-100 disabled:bg-neutral-300 disabled:cursor-not-allowed text-neutral-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full mt-2"
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
