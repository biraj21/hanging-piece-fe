import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon, FlipVerticalIcon } from "lucide-react";

interface MoveControlsProps {
  goToFirst: () => void;
  goToLast: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  flipBoard: () => void;
  disabled?: boolean;
}

export const MoveControls: React.FC<MoveControlsProps> = ({
  goToFirst,
  goToLast,
  goToPrevious,
  goToNext,
  flipBoard,
  disabled,
}) => {
  return (
    <fieldset disabled={disabled}>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={goToFirst}
          className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition flex items-center justify-center"
          title="First move"
        >
          <ChevronFirstIcon size={16} />
        </button>
        <button
          onClick={goToPrevious}
          className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition flex items-center justify-center"
          title="Previous move"
        >
          <ChevronLeftIcon size={16} />
        </button>
        <button
          onClick={goToNext}
          className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition flex items-center justify-center"
          title="Next move"
        >
          <ChevronRightIcon size={16} />
        </button>
        <button
          onClick={goToLast}
          className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition flex items-center justify-center"
          title="Last move"
        >
          <ChevronLastIcon size={16} />
        </button>
        <button
          onClick={flipBoard}
          className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition flex items-center justify-center"
          title="Flip board"
        >
          <FlipVerticalIcon size={16} />
        </button>
      </div>
    </fieldset>
  );
};
