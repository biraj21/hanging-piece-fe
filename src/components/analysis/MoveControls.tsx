import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, FlipVertical } from "lucide-react";

interface MoveControlsProps {
  goToFirst: () => void;
  goToLast: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  flipBoard: () => void;
}

export const MoveControls: React.FC<MoveControlsProps> = ({
  goToFirst,
  goToLast,
  goToPrevious,
  goToNext,
  flipBoard,
}) => {
  return (
    <div className="mt-4 flex gap-2 shrink-0">
      <button
        onClick={goToFirst}
        className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition flex items-center justify-center"
        title="First move"
      >
        <ChevronFirst size={16} />
      </button>
      <button
        onClick={goToPrevious}
        className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition flex items-center justify-center"
        title="Previous move"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={goToNext}
        className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition flex items-center justify-center"
        title="Next move"
      >
        <ChevronRight size={16} />
      </button>
      <button
        onClick={goToLast}
        className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition flex items-center justify-center"
        title="Last move"
      >
        <ChevronLast size={16} />
      </button>
      <button
        onClick={flipBoard}
        className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition flex items-center justify-center"
        title="Flip board"
      >
        <FlipVertical size={16} />
      </button>
    </div>
  );
};
