import { BookOpenIcon, BrainIcon, LightbulbIcon } from "lucide-react";
import { useEffect, useState } from "react";

const LOADING_STAGES = [
  { message: "Studying your move...", icon: BookOpenIcon },
  { message: "Looking for patterns...", icon: BrainIcon },
  { message: "Generating explanation...", icon: LightbulbIcon },
] as const;

const CHESS_TRIVIA = [
  "There are more possible chess games than atoms in the observable universe.",
  "The chessboard has 64 squares arranged in an 8x8 grid.",
  "Chess originated in India before the 600s AD from a game called chaturanga.",
  "The longest official chess game ever played was 269 moves (Nikolic vs Arsovic, 1989).",
  "In Armenian schools, chess is a required subject.",
  "It is possible to checkmate in just two moves (Fool's Mate).",
  "There are about 318 billion possible positions after four moves each.",
  "The second book ever printed in English was about chess.",
  "Initially the queen could only move one square diagonally; later she became the most powerful piece.",
  "A bishop always remains on its original color and can never visit the opposite color.",
  "There are 400 different possible positions after one move each.",
  "Bobby Fischer's 'Game of the Century' was played when he was only 13.",
  "The rook's name comes from Persian 'rukh,' meaning chariot.",
  "Players can be connected by a 'Morphy number' like an Erdős number, based on playing games against opponents linking back to Paul Morphy.",
  "The first international chess tournament was in London, 1851, won by Adolf Anderssen.",
  "'Zugzwang' is when any move worsens a player's position, yet they must move.",
  "Chess play can be transmitted remotely; the first telegraph chess game was in 1844.",
  "'Threefold repetition' can force a draw if the same position occurs three times.",
  "Polish Immortal is a famous game where Black sacrificed all four knights to win.",
  "Magnus Carlsen has the highest Elo rating ever recorded: 2882.",
];

export const ExplanationLoading: React.FC = () => {
  const [stageIndex, setStageIndex] = useState(0);
  const [triviaIndex] = useState(() =>
    Math.floor(Math.random() * CHESS_TRIVIA.length),
  );
  const [progress, setProgress] = useState(0);
  const CurrentIcon = LOADING_STAGES[stageIndex].icon;

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        if (prev < LOADING_STAGES.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const totalDuration = 15000; // 15 seconds
    const targetPercentage = 90; // Only go to 90% since actual time can be up to 20s
    const updateInterval = 50; // update every 50ms for smooth animation
    const increment = (targetPercentage / totalDuration) * updateInterval;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= targetPercentage) {
          clearInterval(progressInterval);
          return targetPercentage;
        }
        return prev + increment;
      });
    }, updateInterval);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full py-6 lg:py-12">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500/20 animate-ping rounded-full" />
        <div className="relative w-12 h-12 lg:w-20 lg:h-20 bg-linear-to-br from-emerald-500/10 to-emerald-600/20 border-2 border-emerald-500/30 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CurrentIcon className="w-6 h-6 lg:w-10 lg:h-10 text-emerald-400 animate-pulse" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-neutral-200 mb-4 h-7 transition-all duration-300">
        {LOADING_STAGES[stageIndex].message}
      </h3>

      <div className="w-full max-w-md px-6 mb-8">
        <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-neutral-500 mt-2 text-center">
          {Math.round(progress)}%
        </p>
      </div>

      <div className="w-full max-w-lg px-2">
        <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xl p-5 shadow-xl">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
              Did you know?
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {CHESS_TRIVIA[triviaIndex]}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-neutral-500 mt-8">
        Great explanations take a moment to craft
      </p>
    </div>
  );
};
