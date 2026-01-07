import { clsx } from "clsx";
import { BrainIcon } from "lucide-react";

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
        "flex items-center gap-2 px-2 py-1.5 bg-emerald-600  border border-emerald-500/50 rounded-lg text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap transform",
        {
          "opacity-60 cursor-not-allowed hover:bg-emerald-600": disabled,
          "hover:bg-emerald-700": !disabled && onClick,
        }
      )}
    >
      <BrainIcon className="w-4 h-4" />
      {loading ? "Thinking..." : "Tell me why"}
    </button>
  );
};
