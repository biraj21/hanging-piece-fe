import { BrainIcon } from "lucide-react";

interface TellMeWhyButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const TellMeWhyButton: React.FC<TellMeWhyButtonProps> = ({ onClick, disabled = false, loading = false }) => {
  return (
    <button
      onClick={onClick || (() => alert("not implemented yet"))}
      disabled={disabled}
      className={`flex items-center gap-2 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500/50 rounded-lg text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap transform hover:scale-105 ${
        disabled ? "opacity-60 cursor-not-allowed hover:scale-100 hover:bg-emerald-600" : ""
      }`}
    >
      <BrainIcon className="w-4 h-4" />
      {loading ? "Thinking..." : "Tell me why"}
    </button>
  );
};
