import clsx from "clsx";
import { Edit2Icon, LogOutIcon, MailIcon, SaveIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { backendApi } from "@/api/backend";
import { useDebounced } from "@/components/hooks/use-debounced";
import { ProfilePreview } from "@/components/ProfilePreview";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/router/routes";

export default function ProfilePage() {
  const { user, signOut, refreshSession } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [chesscomId, setChesscomId] = useState(user?.chesscomId || "");
  const [lichessId, setLichessId] = useState(user?.lichessId || "");
  const [chesscomIdForQuery, setChesscomIdForQuery] = useState(user?.chesscomId || "");
  const [lichessIdForQuery, setLichessIdForQuery] = useState(user?.lichessId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const debouncedSetChesscomId = useDebounced(setChesscomIdForQuery, 500);
  const debouncedSetLichessId = useDebounced(setLichessIdForQuery, 500);

  const [chesscomValid, setChesscomValid] = useState(false);
  const [lichessValid, setLichessValid] = useState(false);

  useEffect(() => {
    if (user?.chesscomId) {
      setChesscomIdForQuery(user.chesscomId);
    }

    if (user?.lichessId) {
      setLichessIdForQuery(user.lichessId);
    }
  }, [user?.chesscomId, user?.lichessId]);

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.INDEX);
  };

  const handleEdit = () => {
    setChesscomId(user?.chesscomId || "");
    setLichessId(user?.lichessId || "");
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setChesscomId(user?.chesscomId || "");
    setLichessId(user?.lichessId || "");
    setChesscomIdForQuery("");
    setLichessIdForQuery("");
    setError(null);
    setIsEditing(false);

    setChesscomValid(false);
    setLichessValid(false);

    if (user?.chesscomId) {
      setChesscomIdForQuery(user.chesscomId);
    }

    if (user?.lichessId) {
      setLichessIdForQuery(user.lichessId);
    }
  };

  const handleSave = async () => {
    const hasChesscom = chesscomId.trim() && chesscomValid;
    const hasLichess = lichessId.trim() && lichessValid;
    const canSubmit = hasChesscom || hasLichess;

    if (!canSubmit) {
      setError("Please provide at least one valid chess platform username");
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
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-neutral-400 text-sm">Manage your Hanging Piece account and chess platforms</p>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          {user?.image && !imageError ? (
            <img
              src={user.image}
              alt={user.name || user.email || "Profile"}
              onError={() => setImageError(true)}
              className="w-12 h-12 rounded-full border border-neutral-600 object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center text-white text-lg font-semibold border border-neutral-600">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.name || user?.email}</h2>
            <p className="text-xs text-neutral-400">{user?.name ? user.email : "Chess Analyst"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 bg-neutral-800/50 rounded-lg">
          <MailIcon className="w-4 h-4 text-neutral-400" />
          <div className="flex-1">
            <p className="text-xs text-neutral-500">Email</p>
            <p className="text-sm text-white">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Chess Accounts</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Connect your chess platforms</p>
          </div>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-lg transition"
            >
              <Edit2Icon className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label htmlFor="chesscomId" className="block text-xs text-neutral-400 font-medium">
              Your Chess.com
            </label>
            <input
              id="chesscomId"
              type="text"
              value={chesscomId}
              onChange={(e) => {
                setChesscomId(e.target.value);
                debouncedSetChesscomId(e.target.value);
              }}
              disabled={!isEditing || isSubmitting}
              placeholder="e.g., hikaru"
              className="w-full bg-neutral-800/50 border border-neutral-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:bg-neutral-800 disabled:cursor-not-allowed placeholder-neutral-500"
            />
            {(chesscomId || chesscomIdForQuery.trim()) && (
              <ProfilePreview
                platform="chesscom"
                username={chesscomIdForQuery.trim() || chesscomId}
                onLoad={() => setChesscomValid(true)}
                onError={() => setChesscomValid(false)}
                showPlayButton={false}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lichessId" className="block text-xs text-neutral-400 font-medium">
              Your Lichess
            </label>
            <input
              id="lichessId"
              type="text"
              value={lichessId}
              onChange={(e) => {
                setLichessId(e.target.value);
                debouncedSetLichessId(e.target.value);
              }}
              disabled={!isEditing || isSubmitting}
              placeholder="e.g., DrNykterstein"
              className="w-full bg-neutral-800/50 border border-neutral-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 disabled:bg-neutral-800 disabled:cursor-not-allowed placeholder-neutral-500"
            />
            {(lichessId || lichessIdForQuery.trim()) && (
              <ProfilePreview
                platform="lichess"
                username={lichessIdForQuery.trim() || lichessId}
                onLoad={() => setLichessValid(true)}
                onError={() => setLichessValid(false)}
                showPlayButton={false}
              />
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-2.5 rounded-lg">{error}</div>
          )}

          <div
            className={clsx("gap-2 pt-2", {
              flex: isEditing,
              hidden: !isEditing,
            })}
          >
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 flex-1 justify-center px-4 py-2 bg-white hover:bg-neutral-100 disabled:bg-neutral-600 disabled:cursor-not-allowed text-neutral-900 text-sm font-medium rounded-lg transition"
            >
              <SaveIcon className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
            >
              <XIcon className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-3">Account Actions</h3>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-lg transition text-sm font-medium"
        >
          <LogOutIcon className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
