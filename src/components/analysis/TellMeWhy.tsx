import { clsx } from "clsx";
import { BrainIcon, Loader2Icon } from "lucide-react";

interface TellMeWhyButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const TellMeWhyButton: React.FC<TellMeWhyButtonProps> = ({ onClick, disabled = false, loading = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "flex items-center gap-2 px-2 py-1.5 bg-emerald-600 border border-emerald-500/50 rounded-md text-xs font-medium text-white shadow hover:shadow-md transition-all duration-200 whitespace-nowrap",
        {
          "opacity-60 cursor-not-allowed hover:bg-emerald-600": disabled,
          "hover:bg-emerald-700": !disabled && onClick,
        },
      )}
    >
      {loading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <BrainIcon className="w-4 h-4" />}
      {loading ? "Thinking..." : "Tell me why"}
    </button>
  );
};
