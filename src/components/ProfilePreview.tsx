interface ProfilePreviewProps {
  loading?: boolean;
  platform: "chesscom" | "lichess";
  avatar?: string;
  username: string;
  name?: string;
  country?: string;
  league?: string;
  title?: string;
  rating?: number;
  url?: string;
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({
  loading = false,
  platform,
  avatar,
  username,
  name,
  country,
  league,
  title,
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
    <div className="flex items-center gap-3 py-2">
      <div className={`w-10 h-10 rounded-full shrink-0 border border-neutral-700 flex items-center justify-center ${loading ? "bg-neutral-700 animate-pulse" : ""}`}>
        {!loading && avatar ? (
          <img src={avatar} alt={`${username}'s avatar`} className="w-full h-full rounded-full object-cover" />
        ) : !loading && !avatar ? (
          <span className="text-white text-xs font-semibold">{getInitials(displayName)}</span>
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {loading ? (
            <div className="h-4 w-24 bg-neutral-700 rounded animate-pulse" />
          ) : (
            <h3 className="text-white text-sm font-semibold truncate">{displayName}</h3>
          )}
          {loading ? (
            <div className="h-4 w-12 bg-neutral-700 rounded animate-pulse" />
          ) : (
            title && (
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                {title}
              </span>
            )
          )}
          {loading ? (
            <div className="h-4 w-16 bg-neutral-700 rounded animate-pulse" />
          ) : (
            league && (
              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold">
                {league}
              </span>
            )
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-neutral-400 mt-0.5">
          {loading ? (
            <>
              <div className="h-3 w-20 bg-neutral-700 rounded animate-pulse" />
              <div className="h-3 w-10 bg-neutral-700 rounded animate-pulse" />
              <div className="h-3 w-8 bg-neutral-700 rounded animate-pulse" />
            </>
          ) : (
            <>
              <span>@{username}</span>
              {rating !== undefined && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-white">{rating}</span>
                </>
              )}
              {country && (
                <>
                  <span>•</span>
                  <span className="uppercase">{country}</span>
                </>
              )}
              {url && (
                <>
                  <span>•</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors underline"
                  >
                    {platformName}
                  </a>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
