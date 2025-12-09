import type { Key } from "@lichess-org/chessground/types";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import ChessBoard from "@/components/ChessBoard";
import { parsePgnToGame, type ParsedGame } from "@/helpers/pgn";
import AnnotationBlock from "./AnnotationBlock";
import MoveItem from "./MoveItem";

// Initial FEN for the starting position
const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const Analysis: React.FC = () => {
  const [pgn, setPgn] = useState("");
  const [game, setGame] = useState<ParsedGame | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  // Get current move data
  const currentMove = currentMoveIndex >= 0 ? game?.moves[currentMoveIndex] : null;
  const currentFen = currentMove?.fen ?? INITIAL_FEN;
  const lastMove: [Key, Key] | undefined = currentMove ? [currentMove.from as Key, currentMove.to as Key] : undefined;

  const parsePGN = (pgnText: string) => {
    try {
      const parsed = parsePgnToGame(pgnText);
      if (parsed.moves.length === 0) {
        throw new Error("No valid moves found in PGN");
      }

      setGame(parsed);
      setCurrentMoveIndex(0);
      toast.success("PGN parsed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse PGN");
      setGame(null);
    }
  };

  const handlePGNSubmit = () => {
    if (pgn.trim()) {
      parsePGN(pgn);
    }
  };

  const handleMoveClick = useCallback((index: number) => {
    setCurrentMoveIndex(index);
  }, []);

  const goToFirst = useCallback(() => {
    if (!game) {
      return;
    }

    setCurrentMoveIndex(0);
  }, [game]);

  const goToLast = useCallback(() => {
    if (!game) {
      return;
    }

    setCurrentMoveIndex(game.moves.length - 1);
  }, [game]);

  const incrementMoveIndex = useCallback(
    (offset: number) => {
      if (!game) {
        return;
      }

      const newIndex = Math.max(-1, Math.min(currentMoveIndex + offset, game.moves.length - 1));
      setCurrentMoveIndex(newIndex);
    },
    [game, currentMoveIndex]
  );

  const goToNext = useCallback(() => {
    incrementMoveIndex(1);
  }, [incrementMoveIndex]);

  const goToPrevious = useCallback(() => {
    incrementMoveIndex(-1);
  }, [incrementMoveIndex]);

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
  const event = game?.headers.get("Event") || "";
  const site = game?.headers.get("Site") || "";
  const date = game?.headers.get("Date") || "";

  return (
    <div className="h-screen bg-neutral-950 text-white p-4 sm:p-6 flex flex-col overflow-hidden">
      <div className="mx-auto w-full flex flex-col flex-1 min-h-0">
        <h1 className="text-2xl font-light mb-8 tracking-tight shrink-0">Move Explainer</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
          {/* Left Column: Board and Controls */}
          <div className="lg:col-span-2 overflow-y-auto">
            {/* Chessboard */}
            <div className="mb-6">
              <ChessBoard theme="green" fen={currentFen} lastMove={lastMove} />
            </div>

            {/* FEN Display */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wide">FEN</label>
              <input
                type="text"
                value={currentFen}
                readOnly
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded  text-sm text-neutral-400 cursor-not-allowed"
              />
            </div>

            {/* PGN Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wide">PGN</label>
              <textarea
                value={pgn}
                onChange={(e) => setPgn(e.target.value)}
                placeholder="Paste your PGN here (with or without headers)"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded  text-sm text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                rows={6}
              />
            </div>

            <button
              onClick={handlePGNSubmit}
              className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded font-semibold text-sm transition"
            >
              Load PGN
            </button>
          </div>

          {/* Right Column: Move List */}
          <div className="lg:col-span-2 min-h-0 flex flex-col">
            <div className="bg-neutral-900/40 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-5 shadow-lg shadow-neutral-950/20 flex flex-col flex-1 min-h-0">
              {/* Compact Game Info Header */}
              <div className="mb-4 shrink-0">
                {/* Players */}
                {(whiteName || blackName) && (
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm  text-neutral-200 truncate">
                      {whiteName || "White"}
                      {whiteElo ? ` (${whiteElo})` : ""}
                    </div>
                    <div className="text-sm text-neutral-400 mx-2">vs</div>
                    <div className="text-sm  text-neutral-200 truncate text-right">
                      {blackName || "Black"}
                      {blackElo ? ` (${blackElo})` : ""}
                    </div>
                  </div>
                )}

                {/* Event, Site, Date */}
                {(event || site || date) && (
                  <div className="text-[10px] text-neutral-400 mb-1 truncate">
                    {[event, site && `(${site})`, date].filter(Boolean).join(" • ")}
                  </div>
                )}

                {/* Opening */}
                {(opening || eco) && (
                  <div className="text-[10px] text-neutral-300 truncate">
                    <span className="text-neutral-500">Opening: </span>
                    {opening && <span>{opening}</span>}
                    {opening && eco && <span> • </span>}
                    {eco && <span className="text-neutral-400">ECO: {eco}</span>}
                  </div>
                )}
              </div>

              {moves.length === 0 ? (
                <div className="text-neutral-500 text-center py-12">
                  <p className="text-sm opacity-60">Load a PGN to see moves</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
                    {(() => {
                      const rows: React.ReactNode[] = [];
                      let i = 0;

                      while (i < moves.length) {
                        // Capture current indices to avoid closure issues
                        const whiteIndex = i;
                        const blackIndex = i + 1;

                        const isWhite = i % 2 === 0;
                        const moveNumber = Math.floor(i / 2) + 1;
                        const move = moves[i];
                        const annotationType = move.getQuality();
                        const bestLine = move.variations?.[0];
                        const hasAnnotation = !!annotationType && !!bestLine;
                        const hasSimpleAnnotation = !hasAnnotation && move.textComments.length > 0;

                        if (isWhite) {
                          // White's move
                          const blackMove = moves[blackIndex];
                          const blackAnnotationType = blackMove ? blackMove.getQuality() : null;
                          const blackBestLine = blackMove?.variations?.[0];
                          const blackHasAnnotation = !!blackAnnotationType && !!blackBestLine;
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
                            rows.push(<AnnotationBlock key={`ann-${whiteIndex}`} move={move} />);
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
                                rows.push(<AnnotationBlock key={`ann-${blackIndex}`} move={blackMove} />);
                              } else if (blackHasSimpleAnnotation) {
                                rows.push(<AnnotationBlock key={`ann-${blackIndex}`} move={blackMove} isSimple />);
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
                            rows.push(<AnnotationBlock key={`ann-${whiteIndex}`} move={move} isSimple />);
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
                                rows.push(<AnnotationBlock key={`ann-${blackIndex}`} move={blackMove} />);
                              } else if (blackHasSimpleAnnotation) {
                                rows.push(<AnnotationBlock key={`ann-${blackIndex}`} move={blackMove} isSimple />);
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
                              rows.push(<AnnotationBlock key={`ann-${blackIndex}`} move={blackMove!} />);
                            } else if (blackHasSimpleAnnotation) {
                              rows.push(<AnnotationBlock key={`ann-${blackIndex}`} move={blackMove!} isSimple />);
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
                  <div className="mt-4 flex gap-2 shrink-0">
                    <button
                      onClick={goToFirst}
                      className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm font-medium transition flex items-center justify-center"
                      title="First move"
                    >
                      <ChevronFirst size={16} />
                    </button>
                    <button
                      onClick={goToPrevious}
                      className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm font-medium transition flex items-center justify-center"
                      title="Previous move"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={goToNext}
                      className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm font-medium transition flex items-center justify-center"
                      title="Next move"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={goToLast}
                      className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm font-medium transition flex items-center justify-center"
                      title="Last move"
                    >
                      <ChevronLast size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
