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
      onClick={() => {
        if (!onClick || loading || disabled) {
          return;
        }

        onClick();
      }}
      disabled={disabled}
      className={clsx(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors duration-200",
        {
          "cursor-not-allowed bg-emerald-600/60 text-neutral-400": disabled || loading,
          "bg-emerald-600 text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.25)] hover:bg-emerald-500 active:bg-emerald-700":
            !loading && !disabled && onClick,
        },
      )}
    >
      {loading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <BrainIcon className="w-4 h-4" />}
      {loading ? "Thinking..." : "Tell me why"}
    </button>
  );
};
