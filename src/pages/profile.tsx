import { Edit2Icon, LogOutIcon, MailIcon, SaveIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { backendApi } from "@/api/backend";
import { useChesscomProfile, useLichessProfile } from "@/api/queries";
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
    enabled: chesscomIdForQuery.trim().length > 0 && isEditing,
  });

  // Fetch Lichess profile with centralized hook (debounced)
  const {
    data: lichessData,
    isLoading: isValidatingLichess,
    isError: isLichessError,
    isSuccess: isLichessValid,
  } = useLichessProfile(lichessIdForQuery.trim() || null, {
    enabled: lichessIdForQuery.trim().length > 0 && isEditing,
  });

  // Fetch current profiles for display with centralized hooks
  const { data: currentChesscomProfile } = useChesscomProfile(user?.chesscomId, {
    enabled: !!user?.chesscomId && !isEditing,
  });

  const { data: currentLichessProfile } = useLichessProfile(user?.lichessId, {
    enabled: !!user?.lichessId && !isEditing,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.INDEX);
  };

  const handleEdit = () => {
    setChesscomId(user?.chesscomId || "");
    setLichessId(user?.lichessId || "");
    setChesscomIdForQuery(user?.chesscomId || "");
    setLichessIdForQuery(user?.lichessId || "");
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setChesscomId(user?.chesscomId || "");
    setLichessId(user?.lichessId || "");
    setChesscomIdForQuery(user?.chesscomId || "");
    setLichessIdForQuery(user?.lichessId || "");
    setError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Validate that at least one platform is provided
    const hasChesscom = chesscomId.trim() && isChesscomValid;
    const hasLichess = lichessId.trim() && isLichessValid;
    const canSubmit = hasChesscom || hasLichess;

    if (!canSubmit) {
      setError("Please provide at least one valid chess platform username");
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
      {/* Profile Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-neutral-400 text-sm">Manage your Hanging Piece account and chess platforms</p>
      </div>

      {/* Account Info */}
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

      {/* Chess Accounts */}
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

        {!isEditing ? (
          /* Display Mode */
          <div className="space-y-4">
            {user?.chesscomId && currentChesscomProfile ? (
              <div>
                <p className="text-xs text-neutral-500 font-medium mb-2">Chess.com</p>
                <ProfilePreview
                  platform="chesscom"
                  avatar={currentChesscomProfile.avatar}
                  username={currentChesscomProfile.username || user.chesscomId}
                  name={currentChesscomProfile.name}
                  country={currentChesscomProfile.country}
                  league={currentChesscomProfile.league}
                  url={currentChesscomProfile.url}
                  showPlayButton
                />
              </div>
            ) : (
              <div className="p-3 bg-neutral-800/30 border border-neutral-700/50 rounded-lg text-center">
                <p className="text-xs text-neutral-500">No Chess.com account connected</p>
              </div>
            )}

            {user?.lichessId && currentLichessProfile ? (
              <div>
                <p className="text-xs text-neutral-500 font-medium mb-2">Lichess</p>
                <ProfilePreview
                  platform="lichess"
                  username={currentLichessProfile.username || user.lichessId}
                  name={currentLichessProfile.name}
                  title={currentLichessProfile.title}
                  rating={currentLichessProfile.rating}
                  country={currentLichessProfile.country}
                  url={currentLichessProfile.url}
                  showPlayButton
                />
              </div>
            ) : (
              <div className="p-3 bg-neutral-800/30 border border-neutral-700/50 rounded-lg text-center">
                <p className="text-xs text-neutral-500">No Lichess account connected</p>
              </div>
            )}
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-4">
            {/* Chess.com Input */}
            <div className="space-y-1.5">
              <label htmlFor="chesscomId" className="block text-xs text-neutral-400 font-medium">
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
                <p className="text-xs text-neutral-400 flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                  Validating...
                </p>
              )}
              {chesscomId.trim() && !isValidatingChesscom && isChesscomValid && (
                <div className="space-y-2">
                  <p className="text-xs text-green-400 font-medium">✓ Account found</p>
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
                <p className="text-xs text-red-400">✗ Username not found</p>
              )}
            </div>

            {/* Lichess Input */}
            <div className="space-y-1.5">
              <label htmlFor="lichessId" className="block text-xs text-neutral-400 font-medium">
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
                <p className="text-xs text-neutral-400 flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                  Validating...
                </p>
              )}
              {lichessId.trim() && !isValidatingLichess && isLichessValid && (
                <div className="space-y-2">
                  <p className="text-xs text-green-400 font-medium">✓ Account found</p>
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
                <p className="text-xs text-red-400">✗ Username not found</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-2.5 rounded-lg">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={isSubmitting || isValidatingChesscom || isValidatingLichess}
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
        )}
      </div>

      {/* Actions */}
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
