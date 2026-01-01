interface ProfilePreviewProps {
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
      {avatar ? (
        <img
          src={avatar}
          alt={`${username}'s avatar`}
          className="w-10 h-10 rounded-full object-cover shrink-0 border border-neutral-700"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-white text-xs font-semibold shrink-0 border border-neutral-600">
          {getInitials(displayName)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="text-white text-sm font-semibold truncate">{displayName}</h3>
          {title && (
            <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
              {title}
            </span>
          )}
          {league && (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold">
              {league}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-neutral-400 mt-0.5">
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
        </div>
      </div>
    </div>
  );
};
