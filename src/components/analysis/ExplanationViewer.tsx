import { TermHighlighter } from "@/components/TermHighlighter";
import type { ChessTerm } from "@/constants/chess-glossary";
import { getMoveQualityDisplay } from "@/helpers/move-quality";
import type { GameMove } from "@/helpers/pgn";
import type { BlackOrWhite, EngineMove, Explanation } from "@/types";
import clsx from "clsx";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BookOpenIcon,
  EyeIcon,
  GraduationCapIcon,
  ScanEyeIcon,
  TargetIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { ExplanationLoading } from "./ExplanationLoading";
import { MoveQualityIcon } from "./MoveQualityIcon";

type ExplanationViewerProps = {
  move?: GameMove;
  explanation?: Explanation;
  isLoading?: boolean;
  userColor?: BlackOrWhite;
  onVisualize: (lineMove: EngineMove, brush: "red" | "green") => void;
  onNavigateToOriginalMove: () => void;
};

const ExplanationHeader: React.FC = () => (
  <div className="pb-2.5 border-b border-neutral-600/50 flex items-center gap-2 shrink-0">
    <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-green-800 flex items-center justify-center shrink-0">
      <GraduationCapIcon size={16} className="text-white" />
    </div>
    <div className="flex-1">
      <h3 className="text-xs font-semibold text-neutral-200">
        Chess Coach (beta)
      </h3>
      <p className="text-[10px] text-neutral-400">
        Explanations may contain inaccuracies
      </p>
    </div>
  </div>
);

type GuidedStep = "overview" | "bad" | "best";

type OverviewSections = {
  whatFailed: string;
  betterPlan: string;
  remember: string;
};

const parseOverview = (overview: string): OverviewSections => {
  const lines = overview
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const pickFromLines = (label: string) => {
    const line = lines.find((entry) =>
      entry.toLowerCase().startsWith(`${label.toLowerCase()}:`),
    );
    return line ? line.slice(line.indexOf(":") + 1).trim() : "";
  };

  const pickFromText = (label: string, nextLabels: string[]) => {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedNext = nextLabels.map((item) =>
      item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    const boundary =
      escapedNext.length > 0 ? `(?=\\s*(?:${escapedNext.join("|")}):|$)` : "$";
    const regex = new RegExp(
      `${escapedLabel}:\\s*([\\s\\S]*?)${boundary}`,
      "i",
    );
    const match = overview.match(regex);
    return match?.[1]?.trim() || "";
  };

  const byLabel = {
    hook:
      pickFromLines("Hook") ||
      pickFromText("Hook", ["Why this failed", "Better plan", "Remember"]),
    whyFailed:
      pickFromLines("Why this failed") ||
      pickFromText("Why this failed", ["Better plan", "Remember"]),
    betterPlan:
      pickFromLines("Better plan") || pickFromText("Better plan", ["Remember"]),
    remember: pickFromLines("Remember") || pickFromText("Remember", []),
  };

  const combinedWhatFailed = [byLabel.hook, byLabel.whyFailed]
    .filter(Boolean)
    .join(" ");

  if (combinedWhatFailed && byLabel.betterPlan && byLabel.remember) {
    return {
      whatFailed: combinedWhatFailed,
      betterPlan: byLabel.betterPlan,
      remember: byLabel.remember,
    };
  }

  const sentences = overview
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    whatFailed:
      combinedWhatFailed ||
      [sentences[0], sentences[1]].filter(Boolean).join(" ") ||
      "The move looked natural but missed a stronger idea and gave your opponent the initiative.",
    betterPlan:
      byLabel.betterPlan ||
      sentences[2] ||
      "The engine line creates a direct, forcing advantage.",
    remember:
      byLabel.remember ||
      sentences[3] ||
      "Before defending, check if a counter-threat is stronger.",
  };
};

const ExploreLineButton: React.FC<{
  label: string;
  tone: "bad" | "best";
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, tone, onClick, disabled = false }) => {
  const isBad = tone === "bad";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "group mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-all",
        disabled
          ? "cursor-not-allowed bg-neutral-700 text-neutral-400"
          : isBad
            ? "text-red-50  bg-red-500/80  shadow-[0_2px_0_0_rgb(127_29_29)] active:translate-y-px"
            : "text-emerald-50  bg-emerald-600 shadow-[0_2px_0_0_rgb(6_78_59)] active:translate-y-px",
      )}
      title={disabled ? "Line unavailable" : `Open ${label.toLowerCase()} line`}
    >
      <span>{label}</span>
      <ArrowRightIcon
        size={12}
        className="opacity-90 transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
};

const OverviewPanel: React.FC<{
  overview: string;
  matchedTerms: Set<ChessTerm>;
  hasBadLine: boolean;
  hasBestLine: boolean;
  onExploreBad: () => void;
  onExploreBest: () => void;
}> = ({
  overview,
  matchedTerms,
  hasBadLine,
  hasBestLine,
  onExploreBad,
  onExploreBest,
}) => {
  const sections = parseOverview(overview);

  return (
    <div>
      <div className="mt-4 rounded-lg border border-neutral-700/60 bg-linear-to-b from-neutral-800/60 to-neutral-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="w-full px-3 py-2.5 bg-neutral-700/40 border-b border-neutral-600/50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
            <div>
              <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wide">
                {`Read this in three beats`}
              </h4>
              <p className="text-[10px] text-neutral-400 mt-1 leading-none">
                First understand WHY this failed, then compare it to the
                stronger plan, then keep the takeaway.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <section className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {/* <AlertTriangleIcon size={15} className="shrink-0 text-red-300" /> */}
              <h4 className="text-sm font-semibold text-red-400">
                Why this failed
              </h4>
            </div>
            <TermHighlighter
              text={sections.whatFailed}
              className="text-[14px] leading-6 text-neutral-100"
              matchedTerms={matchedTerms}
            />
            <div className="mt-1">
              <ExploreLineButton
                label="Explore this line"
                tone="bad"
                onClick={onExploreBad}
                disabled={!hasBadLine}
              />
            </div>
          </section>

          <section className="min-w-0 border-t border-neutral-700/50 pt-4">
            <div className="flex items-center gap-2 mb-2">
              {/* <TargetIcon size={15} className="shrink-0 text-emerald-300" /> */}
              <h4 className="text-sm font-semibold text-emerald-400">
                Stronger plan
              </h4>
            </div>
            <TermHighlighter
              text={sections.betterPlan}
              className="text-[14px] leading-6 text-neutral-100"
              matchedTerms={matchedTerms}
            />
            <div className="mt-1">
              <ExploreLineButton
                label="Explore this line"
                tone="best"
                onClick={onExploreBest}
                disabled={!hasBestLine}
              />
            </div>
          </section>
        </div>
      </div>
      <section className="mt-4 rounded-lg border border-sky-500/20 bg-sky-500/6 p-4">
        <div className="flex items-center gap-2">
          <BookOpenIcon size={15} className="shrink-0 text-sky-300" />
          <h4 className="text-sm font-semibold text-sky-400">Takeaway</h4>
        </div>
        <TermHighlighter
          text={sections.remember}
          className="mt-3 text-[14px] leading-6 text-neutral-100"
          matchedTerms={matchedTerms}
        />
      </section>
    </div>
  );
};

const ExplanationContent: React.FC<{
  move: GameMove;
  explanation: Explanation;
  userColor?: BlackOrWhite;
  onVisualize: (lineMove: EngineMove, brush: "red" | "green") => void;
  onNavigateToOriginalMove: () => void;
}> = ({
  move,
  explanation,
  userColor,
  onVisualize,
  onNavigateToOriginalMove,
}) => {
  const {
    explanation: overview,
    badContinuation,
    bestContinuation,
    badLine,
    bestLine,
  } = explanation;
  const [selectedBadMove, setSelectedBadMove] = useState<number | null>(null);
  const [selectedBestMove, setSelectedBestMove] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<GuidedStep>("overview");

  // Create a shared Set for matched terms across the entire explanation
  const matchedTerms = new Set<ChessTerm>();

  const renderMoveNotation = (san: string, ply: number) => {
    const moveNumber = Math.ceil(ply / 2);
    const isWhite = ply % 2 === 1;
    return isWhite ? `${moveNumber}. ${san}` : `${moveNumber}... ${san}`;
  };

  const getPlayerLabel = (): string => {
    const isWhite = move.ply % 2 === 1;
    const moveColor: BlackOrWhite = isWhite ? "white" : "black";

    if (!userColor) {
      return moveColor;
    }

    const player = moveColor === userColor ? "you" : "your opponent";
    return `${player} (${moveColor})`;
  };

  const playerLabel = getPlayerLabel();
  const moveQuality = move.getQuality();
  const quality = getMoveQualityDisplay(moveQuality);
  const hasBadLine = badContinuation.length > 0 && badLine.length > 0;
  const hasBestLine = bestContinuation.length > 0 && bestLine.length > 0;
  const activeTabClasses =
    "border-cyan-500/35 bg-cyan-500/12 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
  const inactiveTabClasses =
    "border-neutral-600/60 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-700/40";

  const handleOverviewTab = () => {
    setActiveStep("overview");
    onNavigateToOriginalMove();
  };

  const handleExploreBad = () => {
    if (!hasBadLine) return;
    setActiveStep("bad");
    setSelectedBestMove(null);
    setSelectedBadMove(0);
    onVisualize(badLine[0], "red");
  };

  const handleExploreBest = () => {
    if (!hasBestLine) return;
    setActiveStep("best");
    setSelectedBadMove(null);
    setSelectedBestMove(0);
    onVisualize(bestLine[0], "green");
  };

  const navigateBadLine = useCallback(
    (offset: number) => {
      if (!hasBadLine) {
        return;
      }

      const currentIndex = selectedBadMove ?? 0;
      const nextIndex = Math.max(
        0,
        Math.min(currentIndex + offset, badLine.length - 1),
      );

      if (nextIndex === currentIndex) {
        return;
      }

      setSelectedBestMove(null);
      setSelectedBadMove(nextIndex);
      onVisualize(badLine[nextIndex], "red");
    },
    [badLine, hasBadLine, onVisualize, selectedBadMove],
  );

  const navigateBestLine = useCallback(
    (offset: number) => {
      if (!hasBestLine) {
        return;
      }

      const currentIndex = selectedBestMove ?? 0;
      const nextIndex = Math.max(
        0,
        Math.min(currentIndex + offset, bestLine.length - 1),
      );

      if (nextIndex === currentIndex) {
        return;
      }

      setSelectedBadMove(null);
      setSelectedBestMove(nextIndex);
      onVisualize(bestLine[nextIndex], "green");
    },
    [bestLine, hasBestLine, onVisualize, selectedBestMove],
  );

  useEffect(() => {
    if (activeStep === "overview") {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        if (activeStep === "bad") {
          navigateBadLine(-1);
        } else if (activeStep === "best") {
          navigateBestLine(-1);
        }
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        if (activeStep === "bad") {
          navigateBadLine(1);
        } else if (activeStep === "best") {
          navigateBestLine(1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStep, navigateBadLine, navigateBestLine]);

  return (
    <div className="py-3 flex-1 min-h-0 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div
            className={`text-sm font-bold ${quality.color} flex items-center gap-2`}
          >
            {moveQuality && (
              <MoveQualityIcon moveQuality={moveQuality} size="medium" />
            )}
            <span>
              {renderMoveNotation(move.san, move.ply)} was a {quality.text}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={handleOverviewTab}
              className={clsx(
                "rounded-md border px-2.5 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 justify-center md:justify-start",
                activeStep === "overview"
                  ? activeTabClasses
                  : inactiveTabClasses,
              )}
            >
              <ScanEyeIcon size={13} />
              <span className="uppercase tracking-wide font-semibold hidden md:inline">
                Overview
              </span>
            </button>
            {badContinuation.length > 0 && (
              <button
                onClick={handleExploreBad}
                className={clsx(
                  "rounded-md border px-2.5 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 justify-center md:justify-start",
                  activeStep === "bad" ? activeTabClasses : inactiveTabClasses,
                )}
              >
                <AlertTriangleIcon size={13} />
                <span className="uppercase tracking-wide font-semibold hidden md:inline">
                  Why This Failed
                </span>
              </button>
            )}
            <button
              onClick={handleExploreBest}
              className={clsx(
                "rounded-md border px-2.5 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 justify-center md:justify-start",
                activeStep === "best" ? activeTabClasses : inactiveTabClasses,
              )}
            >
              <TargetIcon size={13} className=" shrink-0" />
              <span className=" uppercase tracking-wide font-semibold hidden md:inline">
                Stronger Plan
              </span>
            </button>
          </div>
        </div>

        {
          <div
            className={clsx({
              hidden: activeStep != "overview",
            })}
          >
            <OverviewPanel
              overview={overview}
              matchedTerms={matchedTerms}
              hasBadLine={hasBadLine}
              hasBestLine={hasBestLine}
              onExploreBad={handleExploreBad}
              onExploreBest={handleExploreBest}
            />
          </div>
        }

        {badContinuation.length > 0 && (
          <div
            className={clsx(
              "bg-neutral-800/50 border border-neutral-600/50 rounded-lg overflow-hidden",
              {
                hidden: activeStep != "bad",
              },
            )}
          >
            <div className="w-full px-3 py-2.5 bg-neutral-700/40 border-b border-neutral-600/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <div>
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                    {`What goes wrong for ${playerLabel}`}
                  </h4>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-none">
                    Click a move to visualize
                  </p>
                </div>
              </div>
            </div>

            <div className="px-3 py-2.5 space-y-1.5">
              {badContinuation.map((cont, idx) => (
                <MoveCard
                  key={`bad-${idx}`}
                  type="bad"
                  cont={cont}
                  ply={move.ply + idx + 1}
                  isSelected={selectedBadMove === idx}
                  matchedTerms={matchedTerms}
                  onClick={() => {
                    setSelectedBestMove(null);
                    setSelectedBadMove(idx);
                    onVisualize(badLine[idx], "red");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {bestContinuation.length > 0 && (
          <div
            className={clsx(
              "bg-neutral-800/50 border border-neutral-600/50 rounded-lg overflow-hidden",
              {
                hidden: activeStep != "best",
              },
            )}
          >
            <div className="w-full px-3 py-2.5 bg-neutral-700/40 border-b border-neutral-600/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                    {`What ${playerLabel} should have done`}
                  </h4>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-none">
                    Click a move to visualize
                  </p>
                </div>
              </div>
            </div>

            <div className="px-3 py-2.5 space-y-1.5">
              {bestContinuation.map((cont, idx) => (
                <MoveCard
                  key={`best-${idx}`}
                  type="best"
                  cont={cont}
                  ply={move.ply + idx}
                  isSelected={selectedBestMove === idx}
                  matchedTerms={matchedTerms}
                  onClick={() => {
                    setSelectedBadMove(null);
                    setSelectedBestMove(idx);
                    onVisualize(bestLine[idx], "green");
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MoveCardProps {
  type: "bad" | "best";
  cont: {
    move: string;
    color?: string | undefined;
    reason: string;
  };
  ply: number;
  isSelected: boolean;
  matchedTerms: Set<ChessTerm>;
  onClick: () => void;
}

const MoveCard: React.FC<MoveCardProps> = ({
  type,
  cont,
  ply,
  isSelected,
  matchedTerms,
  onClick,
}) => {
  const moveNum = Math.ceil(ply / 2);
  const isWhite = ply % 2 === 1;
  const isBest = type === "best";

  const baseClasses = "hover:bg-neutral-700/50 transition-colors";

  const selectedClasses = isSelected
    ? isBest
      ? "bg-emerald-500/10 border-l-2 border-l-emerald-500"
      : "bg-red-500/10 border-l-2 border-l-red-500"
    : "border-l-2 border-l-transparent";

  const moveNotationClass = isSelected
    ? isBest
      ? "text-emerald-400 font-semibold"
      : "text-red-400 font-semibold"
    : "text-neutral-200 font-medium";

  return (
    <button
      onClick={onClick}
      className={clsx(
        "group w-full text-sm p-2 text-left cursor-pointer",
        baseClasses,
        selectedClasses,
      )}
      title="Click to visualize this position"
    >
      <div className="flex items-center">
        <span className={`${moveNotationClass} font-mono shrink-0 text-sm`}>
          {isWhite ? `${moveNum}. ${cont.move}` : `${moveNum}... ${cont.move}`}
        </span>
        <EyeIcon
          size={14}
          className={`ml-2 shrink-0 transition-opacity ${
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-70"
          } ${isBest ? "text-emerald-400" : "text-red-400"}`}
        />
      </div>

      <p
        className={clsx("text-xs leading-relaxed flex-1 pt-0.5", {
          "text-neutral-400": !isSelected,
          "text-neutral-300": isSelected,
        })}
      >
        <TermHighlighter text={cont.reason} matchedTerms={matchedTerms} />
      </p>
    </button>
  );
};

export const ExplanationViewer: React.FC<ExplanationViewerProps> = ({
  move,
  explanation,
  isLoading = false,
  userColor,
  onVisualize,
  onNavigateToOriginalMove,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <ExplanationHeader />
        <ExplanationLoading />
      </div>
    );
  }

  if (!explanation || !move) {
    return (
      <div className="flex flex-col h-full">
        <ExplanationHeader />
        <p className="text-center text-sm text-neutral-400 mb-2 max-w-sm mx-auto py-8">
          Click "Tell me why" on any mistake or blunder to get a guided
          explanation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ExplanationHeader />
      <ExplanationContent
        move={move}
        explanation={explanation}
        userColor={userColor}
        onVisualize={onVisualize}
        onNavigateToOriginalMove={onNavigateToOriginalMove}
      />
    </div>
  );
};
