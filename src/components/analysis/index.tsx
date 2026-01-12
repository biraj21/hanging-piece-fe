import type { Key } from "@lichess-org/chessground/types";
import type { Evaluation } from "chessops/pgn";
import clsx from "clsx";
import {
  BrainIcon,
  ChessKnightIcon,
  CrownIcon,
  FileTextIcon,
  HandshakeIcon,
  Loader2Icon,
  SearchIcon,
  SettingsIcon,
  type LucideProps,
} from "lucide-react";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { ChessBoard, type BoardArrow } from "@/components/ChessBoard";
import { INITIAL_FEN, STOCKFISH_DEFAULT_DEPTH } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { explain } from "@/helpers/explain";
import { analyzeGame, type AnalysisProgress } from "@/helpers/game-analyzer";
import { hasAnalysis, isMateEval, parsePgnToGame, type ParsedGame } from "@/helpers/pgn";
import { isCentipawnEval, Stockfish } from "@/helpers/stockfish";
import type { BlackOrWhite, EngineMove, Explanation } from "@/types";
import { generateGameHash } from "@/utils/chess";
import { isUrl } from "@/utils/string";

import { getChessAccountUsername } from "@/helpers/chess-username";
import { AnalysisSummary } from "./AnalysisSummary";
import { AnalysisSummaryModal } from "./AnalysisSummaryModal";
import { AnnotationBlock } from "./AnnotationBlock";
import { ExplanationViewer } from "./ExplanationViewer";
import { LoginModal } from "./LoginModal";
import { MoveControls } from "./MoveControls";
import { MoveItem } from "./MoveItem";
import { TellMeWhyButton } from "./TellMeWhy";

interface AnalysisProps {
  gameId?: string;
  pgn?: string;
  boardOrientation?: BlackOrWhite;
  source?: "chesscom" | "lichess" | "pgn";
}

type Tab = "game" | "coach" | "advanced" | "summary";

const STOCKFISH_DEPTH_KEY = "saved-stockfish-depth";

function getStockfishDepth() {
  const saved = localStorage.getItem(STOCKFISH_DEPTH_KEY);
  return saved ? parseInt(saved, 10) : STOCKFISH_DEFAULT_DEPTH;
}

function persistStockfishDepth(depth: number) {
  localStorage.setItem(STOCKFISH_DEPTH_KEY, depth.toString());
}

export const Analysis: React.FC<AnalysisProps> = ({
  gameId: gameIdProp,
  pgn: pgnProp = "",
  boardOrientation: boardOrientationProp = "white",
  source = "pgn",
}) => {
  const engineRef = useRef<Stockfish | null>(null);
  const { user, signIn } = useAuth();
  const [pgn, setPgn] = useState(pgnProp);
  const [boardOrientation, setBoardOrientation] = useState<BlackOrWhite>(boardOrientationProp);
  const [game, setGame] = useState<ParsedGame | null>(null);
  const [gameId, setGameId] = useState<string>(gameIdProp || "");
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [arrows, setArrows] = useState<Array<BoardArrow>>([]);
  const [previewFen, setPreviewFen] = useState<string | null>(null);
  const [previewLastMove, setPreviewLastMove] = useState<[Key, Key] | undefined>(undefined);
  const [previewEvaluation, setPreviewEvaluation] = useState<Evaluation | null>(null);

  // Advanced settings
  const [stockfishDepth, setStockfishDepth] = useState<number>(getStockfishDepth());

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("game");

  // Explanation state
  const [loadingExplanation, setLoadingExplanation] = useState<false | number>(false);
  const [activeExplanation, setActiveExplanation] = useState<{ moveIndex: number; explanation: Explanation } | null>(
    null
  );

  // Analysis state
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [gameHasAnalysis, setGameHasAnalysis] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSummaryAfterAnalysis, setShowSummaryAfterAnalysis] = useState(false);

  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Get current move data
  const currentMove = currentMoveIndex >= 0 ? game?.moves[currentMoveIndex] : null;

  // During analysis, use progress FEN; otherwise use preview FEN (during explanation) or current move FEN
  const currentFen = analysisProgress?.currentFen || previewFen || currentMove?.fen || INITIAL_FEN;
  const previousMove: [Key, Key] | undefined =
    previewLastMove || (currentMove ? [currentMove.from as Key, currentMove.to as Key] : undefined);

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
  const result = game?.headers.get("Result") || "";

  // Determine winner from result string
  let winner: "white" | "black" | "draw" | undefined;
  if (result === "1-0") {
    winner = "white";
  } else if (result === "0-1") {
    winner = "black";
  } else if (result === "1/2-1/2" || result === "0.5-0.5") {
    winner = "draw";
  }

  // Determine user color by comparing usernames from headers with logged-in user
  // This is more reliable than boardOrientation since the board can be flipped
  const userColor: BlackOrWhite | undefined = (() => {
    if (!user || !game) {
      return;
    }

    const username = getChessAccountUsername(user, source);
    if (!username) {
      return;
    }

    const whitePlayer = whiteName.toLowerCase();
    const blackPlayer = blackName.toLowerCase();

    if (username === whitePlayer) {
      return "white";
    }

    if (username === blackPlayer) {
      return "black";
    }

    return;
  })();

  // Compute move annotations for the board (show quality indicator badge on current move only)
  const moveAnnotations = (() => {
    if (!game) {
      return [];
    }

    const currentMove = game.moves[currentMoveIndex];
    if (!currentMove) {
      return [];
    }

    const quality = currentMove.getQuality();
    if (!quality) {
      return [];
    }

    // if we're previewing some other move for explanation, then don't show current move quality annotation
    if (previewFen && previewFen !== currentMove.fen) {
      return [];
    }

    return [
      {
        square: currentMove.to as Key,
        quality,
      },
    ];
  })();

  const parsePGN = (pgnText: string) => {
    try {
      console.debug("parsing PGN from source:", source);
      const parsed = parsePgnToGame(pgnText);
      if (parsed.moves.length === 0) {
        throw new Error("No valid moves found in PGN");
      }

      setGame(parsed);
      setCurrentMoveIndex(0);
      setGameHasAnalysis(hasAnalysis(parsed));

      if (gameIdProp) {
        setGameId(gameIdProp);
      } else {
        // Generate hash for caching explanations
        const hash = generateGameHash(parsed.moves);
        setGameId(hash);
      }
      toast.success("PGN parsed successfully");

      if (!user) {
        return;
      }

      const whitePlayer = parsed.headers.get("White")?.toLowerCase() || "";
      const blackPlayer = parsed.headers.get("Black")?.toLowerCase() || "";
      const username = getChessAccountUsername(user, source);
      const userColor: BlackOrWhite | undefined = (() => {
        if (username === whitePlayer) {
          return "white";
        }

        if (username === blackPlayer) {
          return "black";
        }
      })();

      if (userColor && boardOrientation !== userColor) {
        setBoardOrientation(userColor);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse PGN");
      setGame(null);
      setGameId("");
      setGameHasAnalysis(false);
    }
  };

  const handleStartReview = async () => {
    if (!game || analysisProgress) {
      return;
    }

    const initialAnalysisProgress: AnalysisProgress = {
      currentMoveIndex: -1,
      totalMoves: game.moves.length,
      currentFen: INITIAL_FEN,
    };

    setAnalysisProgress(initialAnalysisProgress);
    setCurrentMoveIndex(0);

    try {
      const analyzedGame = await analyzeGame(
        game,
        stockfishDepth,
        {
          onProgress: (progress) => {
            setAnalysisProgress(progress);
            // Update board to show current position being analyzed
            setCurrentMoveIndex(progress.currentMoveIndex);
          },
        },
        engineRef.current
      );

      setGame(analyzedGame);
      setGameHasAnalysis(true);
      setCurrentMoveIndex(0);
      setShowSummaryAfterAnalysis(true); // Flag to show footer
      setShowSummaryModal(true); // Show summary modal first

      toast.success("Analysis complete!");
    } catch (err) {
      console.error("Analysis failed:", err);
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalysisProgress(null);
    }
  };

  const onPGNChange = useEffectEvent(parsePGN);

  // Auto-parse PGN when provided as prop
  useEffect(() => {
    if (pgnProp && pgnProp.trim()) {
      onPGNChange(pgnProp);
    } else {
      setActiveTab("advanced");
    }
  }, [pgnProp]);

  const handlePGNSubmit = () => {
    if (pgn.trim()) {
      parsePGN(pgn);
      setActiveTab("game");
    }
  };

  const handleMoveClick = (index: number) => {
    if (analysisProgress) {
      return;
    }

    setCurrentMoveIndex(index);
    // Close explanation when navigating to different move
    if (activeExplanation && activeExplanation.moveIndex !== index) {
      setArrows([]);
      setPreviewFen(null);
      setPreviewLastMove(undefined);
      setPreviewEvaluation(null);
    }
  };

  const goToFirst = useCallback(() => {
    if (!game) {
      return;
    }

    setCurrentMoveIndex(0);
    // Close explanation when jumping to first
    if (activeExplanation && activeExplanation.moveIndex !== 0) {
      setArrows([]);
      setPreviewFen(null);
      setPreviewLastMove(undefined);
      setPreviewEvaluation(null);
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
      setArrows([]);
      setPreviewFen(null);
      setPreviewLastMove(undefined);
      setPreviewEvaluation(null);
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
        setArrows([]);
        setPreviewFen(null);
        setPreviewLastMove(undefined);
        setPreviewEvaluation(null);
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
  const handleExplanation = useCallback(
    async (moveIndex: number, annotationText: string) => {
      try {
        setCurrentMoveIndex(moveIndex);

        // reset all preview states
        setLoadingExplanation(moveIndex);
        setPreviewFen(null);
        setPreviewLastMove(undefined);
        setPreviewEvaluation(null);
        setArrows([]);

        const explanation = await explain({
          gameId: gameId,
          moves: game?.moves || [],
          moveIndex: moveIndex,
          userColor: userColor,
          opening: opening,
          eco: eco,
          annotationText: annotationText,
          engine: engineRef.current,
          depth: stockfishDepth,
        });

        setActiveExplanation({ moveIndex, explanation });
        setLoadingExplanation(false);
        setActiveTab("coach"); // auto-switch to AI Coach tab

        const lastShownTime = localStorage.getItem("login-modal-last-shown");
        const COOLDOWN_PERIOD = 15 * 60 * 1000; // 15 minutes
        if (
          !user &&
          (!lastShownTime || (lastShownTime && Date.now() - parseInt(lastShownTime, 10) > COOLDOWN_PERIOD))
        ) {
          setTimeout(() => {
            setShowLoginModal(true);
            localStorage.setItem("login-modal-last-shown", Date.now().toString());
          }, 10_000);
        }
      } catch (err) {
        console.error("Failed to generate explanation:", err);
        throw err;
      } finally {
        setLoadingExplanation(false);
      }
    },
    [gameId, game, userColor, opening, eco, stockfishDepth, user]
  );

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = Stockfish.create();
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.terminate();
        engineRef.current = null;
      }
    };
  }, []);

  const handleStockfishDepthChange = (depth: number) => {
    setStockfishDepth(depth);
    persistStockfishDepth(depth);
  };

  // Find first mistake/blunder for user
  const findFirstBadMove = useCallback(() => {
    if (!game || !userColor || !user) {
      return null;
    }

    const firstBadMove = game.moves.find((move) => {
      const moveColor = move.ply % 2 === 1 ? "white" : "black";
      const quality = move.getQuality();
      return (
        moveColor === userColor && (quality === "mistake" || quality === "blunder") && move.variations?.[0]?.length
      );
    });

    if (!firstBadMove) {
      return null;
    }

    const moveIndex = game.moves.indexOf(firstBadMove);
    const quality = firstBadMove.getQuality();
    const bestLine = firstBadMove.variations?.[0] || [];
    const annotationText =
      firstBadMove.textComments.join(" ").trim() ||
      `${quality ? quality.charAt(0).toUpperCase() + quality.slice(1) : ""}. Best: ${bestLine
        .map((v) => v.san)
        .join(" ")}`;

    return { moveIndex, annotationText };
  }, [game, userColor, user]);

  // Handle start review from summary modal
  const handleStartExplanation = useCallback(() => {
    setShowSummaryModal(false);
    const badMove = findFirstBadMove();
    if (badMove) {
      handleExplanation(badMove.moveIndex, badMove.annotationText).catch(() => {
        toast.error("Failed to generate explanation. Please try again.");
      });
    }
  }, [findFirstBadMove, handleExplanation]);

  const handleVisualizeMove = useCallback((lineMove: EngineMove, brush: "red" | "green") => {
    if (lineMove.fen) {
      setPreviewFen(lineMove.fen);
      setPreviewLastMove([lineMove.from as Key, lineMove.to as Key]);

      // Show arrow for this move
      setArrows([{ orig: lineMove.from as Key, dest: lineMove.to as Key, brush }]);

      // Set preview evaluation if available
      if (lineMove.evaluation) {
        if (isCentipawnEval(lineMove.evaluation)) {
          setPreviewEvaluation({ pawns: lineMove.evaluation.cp / 100 });
        } else if (isMateEval(lineMove.evaluation)) {
          setPreviewEvaluation({ mate: lineMove.evaluation.mate });
        }
      } else {
        setPreviewEvaluation(null);
      }
    } else {
      console.log("  ❌ No FEN in lineMove");
    }
  }, []);

  const handleNavigateToOriginalMove = useCallback(() => {
    if (!activeExplanation) {
      return;
    }

    // Clear preview state and show the original move position
    setPreviewFen(null);
    setPreviewLastMove(undefined);
    setPreviewEvaluation(null);

    // Navigate to the move that's being explained
    setCurrentMoveIndex(activeExplanation.moveIndex);
  }, [activeExplanation]);

  // Auto-show arrows when navigating to a move with an explanation
  useEffect(() => {
    // Don't mess with arrows if we're in preview mode (viewing a continuation move)
    if (previewFen) {
      return;
    }

    // or if we don't have a game or valid move index
    if (!game || !gameId || currentMoveIndex < 0) {
      return;
    }

    // or if we don't have a current move
    const currentMove = game.moves[currentMoveIndex];
    if (!currentMove) {
      console.error(`No current move found for move index ${currentMoveIndex} (length: ${game.moves.length})`);
      return;
    }

    switch (currentMove.getQuality()) {
      case "inaccuracy":
      case "mistake":
      case "blunder":
        {
          const bestVariation = currentMove.variations?.[0];
          if (!bestVariation) {
            setArrows([]);
            return;
          }

          const bestMove = bestVariation[0];
          if (!bestMove) {
            console.error(`No best move found for move index ${currentMoveIndex}`);
            setArrows([]);
            return;
          }

          setArrows([
            {
              orig: currentMove.from as Key,
              dest: currentMove.to as Key,
              brush: "red",
            },
            {
              orig: bestMove.from as Key,
              dest: bestMove.to as Key,
              brush: "green",
            },
          ]);
        }
        break;
      default:
        setArrows([]);
        return;
    }
  }, [currentMoveIndex, game, gameId, previewFen]);

  // Keyboard navigation for moves
  useEffect(() => {
    if (analysisProgress !== null) {
      return;
    }

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
  }, [goToFirst, goToLast, goToNext, goToPrevious, analysisProgress]);

  const tabs: {
    label: string;
    value: Tab;
    onClick: () => void;
    Icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
    isLoading?: boolean;
  }[] = [
    {
      label: "Game",
      value: "game",
      Icon: ChessKnightIcon,
      onClick() {
        if (activeTab === this.value) {
          return;
        }

        setActiveTab(this.value);
        setPreviewFen(null);
        setPreviewLastMove(undefined);
        setPreviewEvaluation(null);
      },
    },
    {
      label: "AI Coach",
      value: "coach",
      Icon: BrainIcon,
      isLoading: loadingExplanation !== false,
      onClick() {
        setActiveTab(this.value);
      },
    },
    {
      label: "Summary",
      value: "summary",
      Icon: FileTextIcon,
      onClick() {
        setActiveTab(this.value);
      },
    },
    {
      label: "Advanced",
      value: "advanced",
      Icon: SettingsIcon,
      onClick() {
        setActiveTab(this.value);
      },
    },
  ];

  return (
    <div className="h-screen w-full p-4 sm:p-6 overflow-scroll">
      <div className="h-full flex flex-col lg:grid lg:grid-cols-2 lg:grid-rows-1 lg:gap-6 landscape:grid landscape:grid-cols-2 landscape:grid-rows-1 landscape:gap-6">
        {/* Left Column: Board */}
        <div className="shrink-0 flex flex-col gap-3 overflow-y-auto min-h-0">
          <div className="flex flex-col gap-3 max-w-[52vh]  max-lg:landscape:max-w-[72vh] lg:max-w-[82vh] mx-auto w-full">
            {/* Chessboard */}
            <ChessBoard
              theme="green"
              fen={currentFen}
              previousMove={previousMove}
              arrows={arrows}
              orientation={boardOrientation}
              evaluation={previewEvaluation || currentMove?.evaluation || { pawns: 0.0 }}
              players={{
                white: { name: whiteName || "White", elo: whiteElo || "-" },
                black: { name: blackName || "Black", elo: blackElo || "-" },
              }}
              userColor={userColor}
              winner={winner}
              moveAnnotations={moveAnnotations}
            />
          </div>

          {moves.length > 0 && (
            <MoveControls
              disabled={analysisProgress !== null}
              goToFirst={goToFirst}
              goToLast={goToLast}
              goToNext={goToNext}
              goToPrevious={goToPrevious}
              flipBoard={flipBoard}
            />
          )}
        </div>

        {/* Right Column: Tabbed Panel */}
        <div className="grow mt-4 flex flex-col text-xs lg:text-sm min-h-96 lg:h-full lg:mt-0 landscape:h-full landscape:mt-0">
          {/* Tab Headers */}
          <div className="flex gap-1 mb-2 shrink-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => tab.onClick()}
                className={clsx(
                  "px-2 font-medium transition pb-1 border-b-2 flex items-center gap-1 text-xs shrink-0",
                  {
                    "text-white border-emerald-500": activeTab === tab.value,
                    "text-neutral-400 border-transparent hover:text-neutral-300": activeTab !== tab.value,
                  }
                )}
              >
                {!tab.isLoading && <tab.Icon className="w-3 h-3 lg:w-4 lg:h-4" />}
                {tab.isLoading && <Loader2Icon className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-neutral-900/60 border border-neutral-600/50 rounded-xl p-4 lg:p-5 shadow-lg shadow-black/20 flex flex-col flex-1 overflow-y-auto">
            {activeTab === "game" ? (
              <>
                {moves.length === 0 && (
                  <div className="text-neutral-500 text-center py-12">
                    <p className="text-sm opacity-60">Load a PGN from Advanced tab to see moves</p>
                  </div>
                )}
                {analysisProgress && (
                  <div className="flex flex-col items-center justify-center py-4 space-y-4 mb-4">
                    <div className="w-full max-w-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-neutral-400">Analyzing game...</span>
                        <span className="text-sm text-neutral-400">
                          {`${analysisProgress.currentMoveIndex + 1} / ${analysisProgress.totalMoves}`}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-700 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${((analysisProgress.currentMoveIndex + 1) / analysisProgress.totalMoves) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {moves.length > 0 && !gameHasAnalysis && !analysisProgress && (
                  <div className="flex flex-col items-center justify-center py-4 space-y-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-neutral-400 text-center max-w-md">
                        This game does not have analysis yet.
                      </p>
                    </div>
                    <button
                      onClick={handleStartReview}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                    >
                      <SearchIcon className="w-4 h-4" />
                      Start Review
                    </button>
                  </div>
                )}
                {moves.length > 0 && (
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
                                  explainDisabled={loadingExplanation !== false && loadingExplanation !== whiteIndex}
                                  explanationLoading={loadingExplanation === whiteIndex}
                                  explain={handleExplanation}
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
                                      explainDisabled={
                                        loadingExplanation !== false && loadingExplanation !== blackIndex
                                      }
                                      explanationLoading={loadingExplanation === blackIndex}
                                      explain={handleExplanation}
                                    />
                                  );
                                } else if (blackHasSimpleAnnotation) {
                                  rows.push(
                                    <AnnotationBlock
                                      key={`ann-${blackIndex}`}
                                      moves={moves}
                                      moveIndex={blackIndex}
                                      isSimple
                                      explainDisabled={
                                        loadingExplanation !== false && loadingExplanation !== blackIndex
                                      }
                                      explanationLoading={loadingExplanation === blackIndex}
                                      explain={handleExplanation}
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
                                  isSimple
                                  explainDisabled={loadingExplanation !== false && loadingExplanation !== whiteIndex}
                                  explanationLoading={loadingExplanation === whiteIndex}
                                  explain={handleExplanation}
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
                                      explainDisabled={
                                        loadingExplanation !== false && loadingExplanation !== blackIndex
                                      }
                                      explanationLoading={loadingExplanation === blackIndex}
                                      explain={handleExplanation}
                                    />
                                  );
                                } else if (blackHasSimpleAnnotation) {
                                  rows.push(
                                    <AnnotationBlock
                                      key={`ann-${blackIndex}`}
                                      moves={moves}
                                      moveIndex={blackIndex}
                                      isSimple
                                      explainDisabled={
                                        loadingExplanation !== false && loadingExplanation !== blackIndex
                                      }
                                      explanationLoading={loadingExplanation === blackIndex}
                                      explain={handleExplanation}
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
                                    explainDisabled={loadingExplanation !== false && loadingExplanation !== blackIndex}
                                    explanationLoading={loadingExplanation === blackIndex}
                                    explain={handleExplanation}
                                  />
                                );
                              } else if (blackHasSimpleAnnotation) {
                                rows.push(
                                  <AnnotationBlock
                                    key={`ann-${blackIndex}`}
                                    moves={moves}
                                    moveIndex={blackIndex}
                                    isSimple
                                    explainDisabled={loadingExplanation !== false && loadingExplanation !== blackIndex}
                                    explanationLoading={loadingExplanation === blackIndex}
                                    explain={handleExplanation}
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
                  </>
                )}
              </>
            ) : activeTab === "coach" ? (
              <>
                {activeExplanation && (
                  <ExplanationViewer
                    move={moves[activeExplanation.moveIndex]}
                    explanation={activeExplanation.explanation}
                    userColor={userColor}
                    onVisualize={handleVisualizeMove}
                    onNavigateToOriginalMove={handleNavigateToOriginalMove}
                  />
                )}
                {!activeExplanation && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-neutral-400 leading-relaxed text-center flex items-center justify-center flex-wrap">
                      <span>Click the &nbsp;</span> <TellMeWhyButton onClick={() => setActiveTab("game")} />{" "}
                      <span>&nbsp;on any of your mistakes to get started!</span>
                    </div>
                  </div>
                )}
              </>
            ) : activeTab === "summary" ? (
              <>
                {/* Game Summary */}
                {game && (
                  <div className="space-y-6">
                    {/* Game Info */}
                    <div>
                      <div className="space-y-2">
                        {event && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-400 min-w-20">Event:</span>
                            <span className="text-sm text-white">{event}</span>
                          </div>
                        )}
                        {site && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-400 min-w-20">Site:</span>
                            <span className="text-sm text-white">
                              {isUrl(site) ? (
                                <a href={site} target="_blank" rel="noopener noreferrer" className="underline">
                                  {site}
                                </a>
                              ) : (
                                site
                              )}
                            </span>
                          </div>
                        )}
                        {date && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-400 min-w-20">Date:</span>
                            <span className="text-sm text-white">{date}</span>
                          </div>
                        )}
                        {(opening || eco) && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-400 min-w-20">Opening:</span>
                            <span className="text-sm text-white">
                              {opening}
                              {opening && eco && <span className="text-neutral-400 mx-2">•</span>}
                              {eco && <span className="text-neutral-300">ECO: {eco}</span>}
                            </span>
                          </div>
                        )}
                        {result && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-400 min-w-20">Result:</span>
                            <span className="text-sm text-white flex items-center gap-2">
                              {result}
                              {winner === "white" && <CrownIcon className="inline w-4 h-4 text-amber-400" />}
                              {winner === "black" && <CrownIcon className="inline w-4 h-4 text-amber-400" />}
                              {winner === "draw" && <HandshakeIcon className="inline w-4 h-4 text-neutral-400" />}
                            </span>
                          </div>
                        )}
                        {gameHasAnalysis && game && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-400 min-w-20">Status:</span>
                            <span className="text-sm text-emerald-400">Analyzed</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Analysis Summary Table */}
                    {gameHasAnalysis && game && (
                      <AnalysisSummary game={game} whiteName={whiteName} blackName={blackName} userColor={userColor} />
                    )}

                    {!gameHasAnalysis && game && (
                      <div>
                        <div className="text-center py-8">
                          <p className="text-sm text-neutral-400 mb-4">This game hasn't been analyzed yet.</p>
                          <button
                            onClick={handleStartReview}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-sm transition-colors"
                          >
                            Start Review
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!game && (
                  <div className="text-neutral-500 text-center py-12">
                    <p className="text-sm opacity-60">Load a PGN from Advanced tab to see game summary</p>
                  </div>
                )}
              </>
            ) : (
              <>
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

                {/* Stockfish Depth Control */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-neutral-300 mb-2 uppercase tracking-wide">
                    Stockfish Analysis Depth
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="25"
                      step="1"
                      value={stockfishDepth}
                      onChange={(e) => handleStockfishDepthChange(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer  accent-emerald-600"
                    />
                    <div className="flex items-center gap-2 min-w-[60px]">
                      <span className="text-sm text-neutral-300 font-mono">{stockfishDepth}</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Higher depth = more accurate analysis but slower explanations
                  </p>
                </div>

                {/* PGN Input */}
                <div className="mb-4 flex-1 min-h-30 flex flex-col">
                  <label className="block text-sm font-semibold text-neutral-300 mb-2 uppercase tracking-wide">
                    PGN
                  </label>
                  <textarea
                    value={pgn}
                    onChange={(e) => setPgn(e.target.value)}
                    readOnly={!!pgnProp}
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Summary Modal */}
      {showSummaryModal && game && (
        <AnalysisSummaryModal
          game={game}
          whiteName={whiteName}
          blackName={blackName}
          userColor={userColor}
          onStart={handleStartExplanation}
          onClose={() => {
            setShowSummaryModal(false);
            setShowSummaryAfterAnalysis(false); // Reset flag when closed
          }}
          afterAnalysis={showSummaryAfterAnalysis}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => signIn(window.location.pathname)}
      />
    </div>
  );
};
