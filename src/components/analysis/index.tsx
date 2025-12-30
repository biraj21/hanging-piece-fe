import type { Key } from "@lichess-org/chessground/types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ChessBoard, type BoardArrow } from "@/components/ChessBoard";
import { INITIAL_FEN } from "@/constants";
import { getExplanation } from "@/helpers/explanation-cache";
import { parsePgnToGame, type GameMove, type ParsedGame } from "@/helpers/pgn";
import type { BlackAndWhite, EngineLineMove } from "@/types";
import { generateGameHash } from "@/utils/chess";
import { isUrl } from "@/utils/string";

import { AnnotationBlock } from "./AnnotationBlock";
import { ExplanationViewer } from "./ExplanationViewer";
import { MoveControls } from "./MoveControls";
import { MoveItem } from "./MoveItem";

type ActiveExplanation = {
  move: GameMove;
  moveIndex: number;
  explanation: string;
  badContinuation: Array<{ move: string; color?: string; reason: string }>;
  bestContinuation: Array<{ move: string; color?: string; reason: string }>;
  badLine: Array<EngineLineMove>;
  bestLine: Array<EngineLineMove>;
};

interface AnalysisProps {
  gameId?: string;
  pgn?: string;
  boardOrientation?: BlackAndWhite;
  source?: "chesscom" | "lichess" | "pgn";
}

export const Analysis: React.FC<AnalysisProps> = ({
  gameId: gameIdProp,
  pgn: pgnProp = "",
  boardOrientation: boardOrientationProp = "white",
  source = "pgn",
}) => {
  const [pgn, setPgn] = useState(pgnProp);
  const [boardOrientation, setBoardOrientation] = useState<BlackAndWhite>(boardOrientationProp);
  const [game, setGame] = useState<ParsedGame | null>(null);
  const [gameId, setGameId] = useState<string>(gameIdProp || "");
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [arrows, setArrows] = useState<Array<BoardArrow>>([]);
  const [previewFen, setPreviewFen] = useState<string | null>(null);
  const [previewLastMove, setPreviewLastMove] = useState<[Key, Key] | undefined>(undefined);

  // Tab state
  const [activeTab, setActiveTab] = useState<"game" | "coach" | "advanced">("game");

  // Explanation state
  const [activeExplanation, setActiveExplanation] = useState<ActiveExplanation | null>(null);
  const [explanationStep, setExplanationStep] = useState(0);

  // Get current move data
  const currentMove = currentMoveIndex >= 0 ? game?.moves[currentMoveIndex] : null;
  const currentFen = previewFen || currentMove?.fen || INITIAL_FEN;
  const previousMove: [Key, Key] | undefined =
    previewLastMove || (currentMove ? [currentMove.from as Key, currentMove.to as Key] : undefined);

  const parsePGN = (pgnText: string) => {
    try {
      console.debug("parsing PGN from source:", source);
      const parsed = parsePgnToGame(pgnText);
      if (parsed.moves.length === 0) {
        throw new Error("No valid moves found in PGN");
      }

      setGame(parsed);
      setCurrentMoveIndex(0);

      if (gameIdProp) {
        setGameId(gameIdProp);
      } else {
        // Generate hash for caching explanations
        const hash = generateGameHash(parsed.moves);
        setGameId(hash);
      }
      toast.success("PGN parsed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse PGN");
      setGame(null);
      setGameId("");
    }
  };

  const handlePGNSubmit = () => {
    if (pgn.trim()) {
      parsePGN(pgn);
      setActiveTab("game");
    }
  };

  const handleMoveClick = (index: number) => {
    setCurrentMoveIndex(index);
    // Close explanation when navigating to different move
    if (activeExplanation && activeExplanation.moveIndex !== index) {
      setActiveExplanation(null);
      setExplanationStep(0);
      setArrows([]);
      setPreviewFen(null);
      setPreviewLastMove(undefined);
    }
  };

  const goToFirst = useCallback(() => {
    if (!game) {
      return;
    }

    setCurrentMoveIndex(0);
    // Close explanation when jumping to first
    if (activeExplanation && activeExplanation.moveIndex !== 0) {
      setActiveExplanation(null);
      setExplanationStep(0);
      setArrows([]);
      setPreviewFen(null);
      setPreviewLastMove(undefined);
    }
  }, [game, activeExplanation]);

  const goToLast = useCallback(() => {
    if (!game) {
      return;
    }

    const lastIndex = game.moves.length - 1;
    setCurrentMoveIndex(lastIndex);
    // Close explanation when jumping to last
    if (activeExplanation && activeExplanation.moveIndex !== lastIndex) {
      setActiveExplanation(null);
      setExplanationStep(0);
      setArrows([]);
      setPreviewFen(null);
      setPreviewLastMove(undefined);
    }
  }, [game, activeExplanation]);

  const flipBoard = () => {
    setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
  };

  const incrementMoveIndex = useCallback(
    (offset: number) => {
      if (!game) {
        return;
      }

      const newIndex = Math.max(-1, Math.min(currentMoveIndex + offset, game.moves.length - 1));
      setCurrentMoveIndex(newIndex);

      // Close explanation when navigating
      if (activeExplanation && activeExplanation.moveIndex !== newIndex) {
        setActiveExplanation(null);
        setExplanationStep(0);
        setArrows([]);
        setPreviewFen(null);
        setPreviewLastMove(undefined);
      }
    },
    [game, currentMoveIndex, activeExplanation]
  );

  const goToNext = useCallback(() => {
    incrementMoveIndex(1);
  }, [incrementMoveIndex]);

  const goToPrevious = useCallback(() => {
    incrementMoveIndex(-1);
  }, [incrementMoveIndex]);

  // Note: Arrows and previews are cleared in navigation handlers when explanation closes

  // Handle explanation display
  const handleShowExplanation = useCallback((explanation: ActiveExplanation) => {
    setActiveExplanation(explanation);
    setExplanationStep(0);
    setCurrentMoveIndex(explanation.moveIndex);
    setPreviewFen(null);
    setPreviewLastMove(undefined);
    // Auto-switch to AI Coach tab
    setActiveTab("coach");
  }, []);

  // Set arrows when explanation changes
  useEffect(() => {
    if (!activeExplanation) return;

    const explanationParagraphs = activeExplanation.explanation.split("\n\n").filter((p) => p.trim().length > 0);
    const explanationEndStep = 1 + explanationParagraphs.length;

    // Show initial arrows during intro and explanation steps
    if (explanationStep < explanationEndStep) {
      const initialArrows: Array<BoardArrow> = [];
      if (activeExplanation.move.from && activeExplanation.move.to) {
        initialArrows.push({
          orig: activeExplanation.move.from as Key,
          dest: activeExplanation.move.to as Key,
          brush: "red",
        });
      }
      if (activeExplanation.bestLine[0]?.from && activeExplanation.bestLine[0]?.to) {
        initialArrows.push({
          orig: activeExplanation.bestLine[0].from as Key,
          dest: activeExplanation.bestLine[0].to as Key,
          brush: "green",
        });
      }
      setArrows(initialArrows);
    }
  }, [activeExplanation, explanationStep]);

  const handleVisualizeMove = useCallback(
    (lineMove: EngineLineMove) => {
      if (lineMove.fen) {
        setPreviewFen(lineMove.fen);
        setPreviewLastMove([lineMove.from as Key, lineMove.to as Key]);

        // Show arrow for this move
        setArrows([{ orig: lineMove.from as Key, dest: lineMove.to as Key, brush: "red" }]);
      } else {
        console.log("  ❌ No FEN in lineMove");
      }
    },
    [activeExplanation]
  );

  const handleNavigateToOriginalMove = useCallback(() => {
    if (!activeExplanation) return;

    // Clear preview state and show the original move position
    setPreviewFen(null);
    setPreviewLastMove(undefined);
    setArrows([]);

    // Navigate to the move that's being explained
    setCurrentMoveIndex(activeExplanation.moveIndex);
  }, [activeExplanation]);

  // Auto-show arrows when navigating to a move with an explanation
  useEffect(() => {
    // Don't show arrows if we're in preview mode (viewing a continuation move)
    if (previewFen) {
      return;
    }

    // Don't show arrows if we don't have a game or valid move index
    if (!game || currentMoveIndex < 0 || !gameId) {
      return;
    }

    const currentMove = game.moves[currentMoveIndex];
    if (!currentMove) {
      return;
    }

    const arrows: BoardArrow[] = [];

    // Check if this move has a cached explanation
    (async () => {
      const cachedExplanation = await getExplanation({ gameId: gameId, moveIndex: currentMoveIndex });

      if (!cachedExplanation || !cachedExplanation.bestContinuation) {
        // No explanation for this move, clear arrows
        setArrows([]);
        return;
      }

      // Add red arrow for the bad move (the move that was played)
      if (currentMove.from && currentMove.to) {
        arrows.push({
          orig: currentMove.from as Key,
          dest: currentMove.to as Key,
          brush: "red",
        });
      }

      // Add green arrow for the best move (first move from PGN's variations)
      if (currentMove.variations && currentMove.variations.length > 0) {
        const bestVariation = currentMove.variations[0];
        if (bestVariation.length > 0) {
          const bestMove = bestVariation[0];
          if (bestMove.from && bestMove.to) {
            arrows.push({
              orig: bestMove.from as Key,
              dest: bestMove.to as Key,
              brush: "green",
            });
          }
        }
      }

      setArrows(arrows);
    })();
  }, [currentMoveIndex, game, gameId, previewFen]);

  // Keyboard navigation for moves
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          e.stopPropagation();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          e.stopPropagation();
          goToNext();
          break;
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          goToFirst();
          break;
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          goToLast();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goToFirst, goToLast, goToNext, goToPrevious]);

  // Derived values from game headers
  const opening = game?.headers.get("Opening") || "";
  const eco = game?.headers.get("ECO") || "";
  const moves = game?.moves || [];

  // Player and event metadata
  const whiteName = game?.headers.get("White") || "";
  const blackName = game?.headers.get("Black") || "";
  const whiteElo = game?.headers.get("WhiteElo") || game?.headers.get("WhiteELO") || "";
  const blackElo = game?.headers.get("BlackElo") || game?.headers.get("BlackELO") || "";
  const event = game?.headers.get("Event") || "-";
  const site = game?.headers.get("Site") || "";
  const date = game?.headers.get("Date") || "";

  return (
    <div className="h-screen bg-neutral-800 text-white p-4 sm:p-6 flex flex-col overflow-hidden">
      <div className="mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* <div className="grid grid-cols-1 grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1 gap-6 flex-1 min-h-0"> */}
        <div className="grid grid-cols-1 grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1 landscape:grid-cols-2 landscape:grid-rows-1 gap-6 flex-1 min-h-0">
          {/* Left Column: Board */}
          <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
            <div className="flex flex-col gap-3 max-w-[52vh] max-lg:landscape:max-w-[72vh] lg:max-w-[82vh] mx-auto w-full">
              {/* Chessboard */}
              <ChessBoard
                theme="green"
                fen={currentFen}
                previousMove={previousMove}
                arrows={arrows}
                orientation={boardOrientation}
                evaluation={currentMove?.evaluation || { pawns: 0.0 }}
                players={{
                  white: { name: whiteName || "White", elo: whiteElo || "-" },
                  black: { name: blackName || "Black", elo: blackElo || "-" },
                }}
              />
            </div>
          </div>

          {/* Right Column: Tabbed Panel */}
          <div className="min-h-0 flex flex-col text-xs lg:text-sm">
            {/* Tab Headers */}
            <div className="flex gap-2 mb-4 shrink-0">
              <button
                onClick={() => setActiveTab("game")}
                className={`px-2 rounded-lg font-medium transition ${
                  activeTab === "game" ? "text-white" : " text-neutral-400 hover:text-neutral-300"
                }`}
              >
                Game
              </button>
              <button
                onClick={() => setActiveTab("coach")}
                className={`px-2 rounded-lg font-medium transition ${
                  activeTab === "coach" ? "text-white" : "text-neutral-400 hover:text-neutral-300"
                }`}
              >
                AI Coach
              </button>
              <button
                onClick={() => setActiveTab("advanced")}
                className={`px-2 rounded-lg font-medium transition ${
                  activeTab === "advanced" ? "text-white" : "text-neutral-400 hover:text-neutral-300"
                }`}
              >
                Advanced
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "game" ? (
              <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-600/50 rounded-xl p-4 lg:p-5 shadow-lg shadow-black/20 flex flex-col flex-1 min-h-0">
                {/* Game Info Header */}
                {(event || site || date || opening || eco) && (
                  <div className="mb-4 shrink-0 hidden lg:block">
                    {/* Event, Site, Date */}
                    {(event || site || date) && (
                      <div className="text-xs text-neutral-200 mb-1.5 truncate">
                        {[event, date].filter(Boolean).join(" • ")}

                        {isUrl(site) && (
                          <>
                            {" • "}
                            <a href={site} target="_black" className="underline">
                              {site}
                            </a>
                          </>
                        )}
                      </div>
                    )}

                    {/* Opening */}
                    {(opening || eco) && (
                      <div className="text-xs text-neutral-300 truncate">
                        <span className="text-neutral-400">Opening: </span>
                        {opening && <span>{opening}</span>}
                        {opening && eco && <span> • </span>}
                        {eco && <span className="text-neutral-300">ECO: {eco}</span>}
                      </div>
                    )}
                  </div>
                )}

                {moves.length === 0 ? (
                  <div className="text-neutral-500 text-center py-12">
                    <p className="text-sm opacity-60">Load a PGN to see moves</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
                      {(() => {
                        const rows: React.ReactNode[] = [];
                        for (let i = 0; i < moves.length; ) {
                          // Capture current indices to avoid closure issues
                          const whiteIndex = i;
                          const blackIndex = i + 1;

                          const isWhite = i % 2 === 0;
                          const moveNumber = Math.floor(i / 2) + 1;
                          const move = moves[i];
                          const annotationType = move.getQuality();
                          const bestLine = move.variations?.[0];
                          const hasAnnotation = !!annotationType && !!bestLine?.length;
                          const hasSimpleAnnotation = !hasAnnotation && move.textComments.length > 0;

                          if (isWhite) {
                            // White's move
                            const blackMove = moves[blackIndex];
                            const blackAnnotationType = blackMove ? blackMove.getQuality() : null;
                            const blackBestLine = blackMove?.variations?.[0];
                            const blackHasAnnotation = !!blackAnnotationType && !!blackBestLine?.length;
                            const blackHasSimpleAnnotation =
                              !blackHasAnnotation && blackMove?.textComments.length
                                ? blackMove.textComments.length > 0
                                : false;

                            if (hasAnnotation) {
                              // Full annotation with best line
                              // White has annotation: show white alone, then comment
                              rows.push(
                                <div key={`row-${whiteIndex}`} className="flex gap-1.5 items-stretch">
                                  <span className="text-neutral-400 text-xs sm:text-sm font-semibold w-6 shrink-0 flex items-center justify-center opacity-75">
                                    {moveNumber}.
                                  </span>
                                  <MoveItem
                                    key={`move-${whiteIndex}`}
                                    move={move}
                                    index={whiteIndex}
                                    isSelected={whiteIndex === currentMoveIndex}
                                    onClick={handleMoveClick}
                                    className="rounded-md"
                                  />
                                  <div className="flex-1 px-2 py-1" />
                                </div>
                              );
                              // Annotation comment with best line
                              rows.push(
                                <AnnotationBlock
                                  key={`ann-${whiteIndex}`}
                                  moves={moves}
                                  moveIndex={whiteIndex}
                                  gameId={gameId}
                                  opening={opening}
                                  eco={eco}
                                  onShowExplanation={handleShowExplanation}
                                />
                              );
                              i++;

                              // Now show black's move on continuation row: ... | black
                              if (blackMove) {
                                rows.push(
                                  <div key={`row-${blackIndex}`} className="flex gap-1.5 items-stretch">
                                    <span className="text-neutral-500 text-xs sm:text-sm w-6 shrink-0 flex items-center justify-center opacity-60">
                                      ...
                                    </span>
                                    <div className="flex-1 px-2 py-1" />
                                    <MoveItem
                                      key={`move-${blackIndex}`}
                                      move={blackMove}
                                      index={blackIndex}
                                      isSelected={blackIndex === currentMoveIndex}
                                      onClick={handleMoveClick}
                                    />
                                  </div>
                                );
                                if (blackHasAnnotation) {
                                  rows.push(
                                    <AnnotationBlock
                                      key={`ann-${blackIndex}`}
                                      moves={moves}
                                      moveIndex={blackIndex}
                                      gameId={gameId}
                                      opening={opening}
                                      eco={eco}
                                      onShowExplanation={handleShowExplanation}
                                    />
                                  );
                                } else if (blackHasSimpleAnnotation) {
                                  rows.push(
                                    <AnnotationBlock
                                      key={`ann-${blackIndex}`}
                                      moves={moves}
                                      moveIndex={blackIndex}
                                      gameId={gameId}
                                      opening={opening}
                                      eco={eco}
                                      isSimple
                                      onShowExplanation={handleShowExplanation}
                                    />
                                  );
                                }
                                i++;
                              }
                            } else if (hasSimpleAnnotation) {
                              // Simple annotation without best line (e.g., "Black resigns." or opening name)
                              rows.push(
                                <div key={`row-${whiteIndex}`} className="flex gap-1.5 items-stretch">
                                  <span className="text-neutral-400 text-xs sm:text-sm font-semibold w-6 shrink-0 flex items-center justify-center opacity-75">
                                    {moveNumber}.
                                  </span>
                                  <MoveItem
                                    move={move}
                                    index={whiteIndex}
                                    isSelected={whiteIndex === currentMoveIndex}
                                    onClick={handleMoveClick}
                                    className="rounded-md"
                                  />
                                  <div className="flex-1 px-2 py-1" />
                                </div>
                              );
                              // Simple annotation comment
                              rows.push(
                                <AnnotationBlock
                                  key={`ann-${whiteIndex}`}
                                  moves={moves}
                                  moveIndex={whiteIndex}
                                  gameId={gameId}
                                  opening={opening}
                                  eco={eco}
                                  isSimple
                                  onShowExplanation={handleShowExplanation}
                                />
                              );
                              i++;

                              // Now show black's move on continuation row: ... | black
                              if (blackMove) {
                                rows.push(
                                  <div key={`row-${blackIndex}`} className="flex gap-1.5 items-stretch">
                                    <span className="text-neutral-500 text-xs sm:text-sm w-6 shrink-0 flex items-center justify-center opacity-60">
                                      ...
                                    </span>
                                    <div className="flex-1 px-2 py-1" />
                                    <MoveItem
                                      move={blackMove}
                                      index={blackIndex}
                                      isSelected={blackIndex === currentMoveIndex}
                                      onClick={handleMoveClick}
                                    />
                                  </div>
                                );
                                if (blackHasAnnotation) {
                                  rows.push(
                                    <AnnotationBlock
                                      key={`ann-${blackIndex}`}
                                      moves={moves}
                                      moveIndex={blackIndex}
                                      gameId={gameId}
                                      opening={opening}
                                      eco={eco}
                                      onShowExplanation={handleShowExplanation}
                                    />
                                  );
                                } else if (blackHasSimpleAnnotation) {
                                  rows.push(
                                    <AnnotationBlock
                                      key={`ann-${blackIndex}`}
                                      moves={moves}
                                      moveIndex={blackIndex}
                                      gameId={gameId}
                                      opening={opening}
                                      eco={eco}
                                      isSimple
                                      onShowExplanation={handleShowExplanation}
                                    />
                                  );
                                }
                                i++;
                              }
                            } else if (blackHasAnnotation || blackHasSimpleAnnotation) {
                              // White has no annotation but black has annotation (full or simple): show white | black then annotation
                              rows.push(
                                <div key={`row-${whiteIndex}`} className="flex gap-1.5 items-stretch">
                                  <span className="text-neutral-400 text-xs sm:text-sm font-semibold w-6 shrink-0 flex items-center justify-center opacity-75">
                                    {moveNumber}.
                                  </span>
                                  <MoveItem
                                    move={move}
                                    index={whiteIndex}
                                    isSelected={whiteIndex === currentMoveIndex}
                                    onClick={handleMoveClick}
                                    className="rounded-md"
                                  />
                                  <MoveItem
                                    move={blackMove!}
                                    index={blackIndex}
                                    isSelected={blackIndex === currentMoveIndex}
                                    onClick={handleMoveClick}
                                  />
                                </div>
                              );
                              i++;

                              // Black's annotation
                              if (blackHasAnnotation) {
                                rows.push(
                                  <AnnotationBlock
                                    key={`ann-${blackIndex}`}
                                    moves={moves}
                                    moveIndex={blackIndex}
                                    gameId={gameId}
                                    opening={opening}
                                    eco={eco}
                                    onShowExplanation={handleShowExplanation}
                                  />
                                );
                              } else if (blackHasSimpleAnnotation) {
                                rows.push(
                                  <AnnotationBlock
                                    key={`ann-${blackIndex}`}
                                    moves={moves}
                                    moveIndex={blackIndex}
                                    gameId={gameId}
                                    opening={opening}
                                    eco={eco}
                                    isSimple
                                    onShowExplanation={handleShowExplanation}
                                  />
                                );
                              }
                              i++;
                            } else {
                              // Neither has annotation: show both moves together
                              rows.push(
                                <div key={`row-${whiteIndex}`} className="flex gap-1.5 items-stretch">
                                  <span className="text-neutral-400 text-xs sm:text-sm font-semibold w-6 shrink-0 flex items-center justify-center opacity-75">
                                    {moveNumber}.
                                  </span>
                                  <MoveItem
                                    move={move}
                                    index={whiteIndex}
                                    isSelected={whiteIndex === currentMoveIndex}
                                    onClick={handleMoveClick}
                                    className="rounded-md"
                                  />
                                  {blackMove ? (
                                    <MoveItem
                                      move={blackMove}
                                      index={blackIndex}
                                      isSelected={blackIndex === currentMoveIndex}
                                      onClick={handleMoveClick}
                                    />
                                  ) : (
                                    <div className="flex-1 px-2 py-1" />
                                  )}
                                </div>
                              );
                              i++;
                              if (blackMove) i++;
                            }
                          } else {
                            // Shouldn't happen in normal flow, but handle edge case
                            i++;
                          }
                        }

                        return rows;
                      })()}
                    </div>

                    {/* Move controls */}
                    <MoveControls
                      goToFirst={goToFirst}
                      goToLast={goToLast}
                      goToNext={goToNext}
                      goToPrevious={goToPrevious}
                      flipBoard={flipBoard}
                    />
                  </>
                )}
              </div>
            ) : activeTab === "coach" ? (
              <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-600/50 rounded-xl p-4 lg:p-5 shadow-lg shadow-black/20 flex flex-col flex-1 min-h-0">
                {activeExplanation && (
                  <ExplanationViewer
                    move={activeExplanation.move}
                    explanation={activeExplanation.explanation}
                    badContinuation={activeExplanation.badContinuation}
                    bestContinuation={activeExplanation.bestContinuation}
                    badLine={activeExplanation.badLine}
                    bestLine={activeExplanation.bestLine}
                    onVisualize={handleVisualizeMove}
                    onNavigateToOriginalMove={handleNavigateToOriginalMove}
                  />
                )}
                {!activeExplanation && (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-neutral-400 leading-relaxed ">
                      Click <span className="font-semibold text-neutral-300">"Tell Me Why"</span> on any of your
                      mistakes to get started!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-600/50 rounded-xl p-4 lg:p-5 shadow-lg shadow-black/20 flex flex-col flex-1 min-h-0 overflow-y-auto">
                <h2 className="text-lg font-semibold text-neutral-100 mb-4">Advanced</h2>

                {/* FEN Display */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-neutral-300 mb-2 uppercase tracking-wide">
                    FEN
                  </label>
                  <input
                    type="text"
                    value={currentFen}
                    readOnly
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-sm text-neutral-300 cursor-not-allowed"
                  />
                </div>

                {/* PGN Input */}
                <div className="mb-4 flex-1 min-h-30 flex flex-col">
                  <label className="block text-sm font-semibold text-neutral-300 mb-2 uppercase tracking-wide">
                    PGN
                  </label>
                  <textarea
                    value={pgn}
                    onChange={(e) => setPgn(e.target.value)}
                    placeholder="Paste your PGN here (with or without headers)"
                    className="flex-1 w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 resize-none"
                  />
                </div>

                {!pgnProp && (
                  <button
                    onClick={handlePGNSubmit}
                    className="w-full px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded font-semibold text-sm transition"
                  >
                    Load PGN
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
