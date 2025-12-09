import { Brain } from "lucide-react";

interface TellMeWhyButtonProps {
  onClick?: () => void;
}

export const TellMeWhyButton: React.FC<TellMeWhyButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick || (() => alert("not implemented yet"))}
      className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500/50 rounded-lg text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap transform hover:scale-105"
    >
      <Brain className="w-4 h-4" />
      Tell me why
    </button>
  );
};
