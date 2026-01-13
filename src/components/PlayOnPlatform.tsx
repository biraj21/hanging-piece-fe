import { ExternalLinkIcon } from "lucide-react";

interface PlayOnPlatformProps {
  platform: "chesscom" | "lichess";
}

const PLATFORM_CONFIG = {
  chesscom: {
    name: "Chess.com",
    playUrl: "https://www.chess.com/play/online",
    iconColor: "bg-green-600",
    textColor: "text-green-400",
    borderColor: "border-green-500/30",
  },
  lichess: {
    name: "Lichess",
    playUrl: "https://lichess.org",
    iconColor: "bg-neutral-600",
    textColor: "text-neutral-300",
    borderColor: "border-neutral-500/30",
  },
};

export const PlayOnPlatform: React.FC<PlayOnPlatformProps> = ({ platform }) => {
  const config = PLATFORM_CONFIG[platform];

  return (
    <a
      href={config.playUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border ${config.borderColor} rounded-lg text-sm font-medium text-white transition-all`}
    >
      <ExternalLinkIcon className="w-4 h-4" />
      Play now
    </a>
  );
};
