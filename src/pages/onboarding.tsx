import clsx from "clsx";
import { CheckCircle2Icon, CheckIcon } from "lucide-react";
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

  const [playsOnChesscom, setPlaysOnChesscom] = useState(Boolean(user?.chesscomId));
  const [playsOnLichess, setPlaysOnLichess] = useState(Boolean(user?.lichessId));
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

  const hasValidId =
    (playsOnChesscom && chesscomId.trim() && chesscomValid) || (playsOnLichess && lichessId.trim() && lichessValid);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    const chessComTrimmed = playsOnChesscom ? chesscomId.trim() : "";
    const lichessTrimmed = playsOnLichess ? lichessId.trim() : "";

    if (!playsOnChesscom && !playsOnLichess) {
      setError("Select at least one platform");
      return;
    }

    if (playsOnChesscom && !chessComTrimmed) {
      setError("Enter your Chess.com username");
      return;
    }

    if (playsOnLichess && !lichessTrimmed) {
      setError("Enter your Lichess username");
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
        chesscomId: chessComTrimmed || null,
        lichessId: lichessTrimmed || null,
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
          <p className="text-neutral-400 text-sm">
            Choose where you play, then add the username for each platform you use.
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-white">Where do you play chess?</p>
                <p className="text-xs text-neutral-400 mt-1">Select all that apply.</p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label
                  className={clsx(
                    "flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors cursor-pointer",
                    playsOnChesscom
                      ? "border-emerald-500 bg-white/5 text-white"
                      : "border-neutral-700 bg-neutral-800/40 text-neutral-300",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={playsOnChesscom}
                    onChange={(e) => {
                      setPlaysOnChesscom(e.target.checked);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    className="h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-white focus:ring-white/30"
                  />
                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-white w-4 h-4 fill-current">
                    <title>Chess.com</title>
                    <path d="M12 0a3.85 3.85 0 0 0-3.875 3.846A3.84 3.84 0 0 0 9.73 6.969l-2.79 1.85c0 .622.144 1.114.434 1.649H9.83c-.014.245-.014.549-.014.925 0 .025.003.048.006.071-.064 1.353-.507 3.472-3.62 5.842-.816.625-1.423 1.495-1.806 2.533a.33.33 0 0 0-.045.084 8.124 8.124 0 0 0-.39 2.516c0 .1.216 1.561 8.038 1.561s8.038-1.46 8.038-1.561c0-2.227-.824-4.048-2.24-5.133-4.034-3.08-3.586-5.74-3.644-6.838h2.458c.29-.535.434-1.027.434-1.649l-2.79-1.836a3.86 3.86 0 0 0 1.604-3.123A3.873 3.873 0 0 0 13.445.275c-.004-.002-.01.004-.015.004A3.76 3.76 0 0 0 12 0Z" />
                  </svg>
                  <span>Chess.com</span>
                </label>

                <label
                  className={clsx(
                    "flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors cursor-pointer",
                    playsOnLichess
                      ? "border-emerald-500 bg-white/5 text-white"
                      : "border-neutral-700 bg-neutral-800/40 text-neutral-300",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={playsOnLichess}
                    onChange={(e) => {
                      setPlaysOnLichess(e.target.checked);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    className="h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-white focus:ring-white/30"
                  />
                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-white w-4 h-4 fill-current">
                    <title>Lichess</title>
                    <path d="M10.457 6.161a.237.237 0 0 0-.296.165c-.8 2.785 2.819 5.579 5.214 7.428.653.504 1.216.939 1.591 1.292 1.745 1.642 2.564 2.851 2.733 3.178a.24.24 0 0 0 .275.122c.047-.013 4.726-1.3 3.934-4.574a.257.257 0 0 0-.023-.06L18.204 3.407 18.93.295a.24.24 0 0 0-.262-.293c-1.7.201-3.115.435-4.5 1.425-4.844-.323-8.718.9-11.213 3.539C.334 7.737-.246 11.515.085 14.128c.763 5.655 5.191 8.631 9.081 9.532.993.229 1.974.34 2.923.34 3.344 0 6.297-1.381 7.946-3.85a.24.24 0 0 0-.372-.3c-3.411 3.527-9.002 4.134-13.296 1.444-4.485-2.81-6.202-8.41-3.91-12.749C4.741 4.221 8.801 2.362 13.888 3.31c.056.01.115 0 .165-.029l.335-.197c.926-.546 1.961-1.157 2.873-1.279l-.694 1.993a.243.243 0 0 0 .02.202l6.082 10.192c-.193 2.028-1.706 2.506-2.226 2.611-.287-.645-.814-1.364-2.306-2.803-.422-.407-1.21-.941-2.124-1.56-2.364-1.601-5.937-4.02-5.391-5.984a.239.239 0 0 0-.165-.295z" />
                  </svg>
                  <span>Lichess</span>
                </label>
              </div>
            </div>

            {playsOnChesscom && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="chesscomId"
                    className={clsx("text-left text-xs font-medium flex items-center", {
                      "text-green-500": chesscomId && chesscomValid,
                      "text-white": !chesscomId || !chesscomValid,
                    })}
                  >
                    Chess.com Username
                    {chesscomId && chesscomValid && <CheckCircle2Icon size={11} className="ml-1" />}
                  </label>
                </div>
                <input
                  id="chesscomId"
                  type="text"
                  value={chesscomId}
                  onChange={(e) => {
                    setChesscomId(e.target.value.trim());
                    debouncedSetChesscomId(e.target.value.trim());
                    setError(null);
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
            )}

            {playsOnLichess && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="lichessId"
                    className={clsx("text-left text-xs font-medium flex items-center", {
                      "text-green-500": lichessId && lichessValid,
                      "text-white": !lichessId || !lichessValid,
                    })}
                  >
                    Lichess Username
                    {lichessId && lichessValid && <CheckCircle2Icon size={11} className="ml-1" />}
                  </label>
                </div>
                <input
                  id="lichessId"
                  type="text"
                  value={lichessId}
                  onChange={(e) => {
                    setLichessId(e.target.value.trim());
                    debouncedSetLichessId(e.target.value.trim());
                    setError(null);
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
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-white hover:bg-neutral-100 disabled:bg-neutral-600 disabled:cursor-not-allowed text-neutral-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full flex items-center justify-center gap-2"
              >
                {hasValidId && <CheckIcon size={14} />}
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
