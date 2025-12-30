interface ProfilePreviewProps {
  platform: "chesscom" | "lichess";
  avatar?: string;
  username: string;
  name?: string;
  country?: string;
  league?: string;
  title?: string;
  followers?: number;
  rating?: number;
  url?: string;
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({
  platform,
  avatar,
  username,
  name,
  country,
  league,
  title,
  followers,
  rating,
  url,
}) => {
  const displayName = name || username;
  const platformName = platform === "chesscom" ? "Chess.com" : "Lichess";

  // Generate initials from display name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  return (
    <div className="bg-neutral-700 rounded-lg p-3 border border-neutral-600">
      <div className="flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt={`${username}'s avatar`} className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
            {getInitials(displayName)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-white text-sm font-medium truncate">{displayName}</h3>
            {title && (
              <span className="text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded font-medium">{title}</span>
            )}
            {league && <span className="text-xs bg-neutral-500 text-neutral-200 px-1.5 py-0.5 rounded">{league}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-neutral-400 text-xs">@{username}</p>
            {rating !== undefined && <span className="text-neutral-400 text-xs">• {rating}</span>}
            {country && <span className="text-neutral-400 text-xs">• {country}</span>}
            {followers !== undefined && <span className="text-neutral-400 text-xs">• {followers} followers</span>}
          </div>
        </div>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-emerald-400 hover:text-emerald-300 underline inline-block mt-2.5"
        >
          View on {platformName} →
        </a>
      )}
    </div>
  );
};
