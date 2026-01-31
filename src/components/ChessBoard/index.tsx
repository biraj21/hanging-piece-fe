import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { DrawShape } from "@lichess-org/chessground/draw";
import type { Key } from "@lichess-org/chessground/types";
import type { Evaluation } from "chessops/pgn";
import clsx from "clsx";
import { Crown, Handshake } from "lucide-react";
import { useEffect, useRef } from "react";

import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.cburnett.css";

import { EvalBar } from "@/components/analysis/EvalBar";
import { getMoveQualityColor, getMoveQualitySymbol } from "@/helpers/move-quality";
import type { MoveQuality } from "@/helpers/pgn";
import type { BlackOrWhite } from "@/types";

import "./style.css";

export type ChessBoardTheme = "dark-gray" | "green";

export interface PlayerInfo {
  name: string;
  elo: string;
}

export type BoardArrow = { orig: Key; dest: Key; brush?: string };

export interface MoveAnnotation {
  square: Key;
  quality: MoveQuality;
}

type ChessBoardPropsBase = {
  move: {
    san: string;
    fen: string;
  };
  previousMove?: [Key, Key];
  theme?: ChessBoardTheme;
  className?: string;
  arrows?: Array<BoardArrow>;
  orientation?: BlackOrWhite;
  evaluation?: Evaluation;
  players?: {
    white: PlayerInfo;
    black: PlayerInfo;
  };
  userColor?: BlackOrWhite;
  winner?: BlackOrWhite | "draw";
  moveAnnotations?: MoveAnnotation[];
};

export type ChessBoardProps =
  | (ChessBoardPropsBase & {
      playable?: never;
      onMove?: never;
      legalDests?: never;
      turnColor?: never;
    })
  | (ChessBoardPropsBase & {
      playable: boolean;
      onMove: (from: Key, to: Key) => void;
      legalDests: Map<Key, Key[]>;
      turnColor: BlackOrWhite;
    });

interface PlayerInfoProps {
  name: string;
  elo: string;
  color: BlackOrWhite;
  position: "left" | "right" | "stacked";
  userColor?: BlackOrWhite;
  winner?: BlackOrWhite | "draw";
  className?: string;
}

const BoardPlayerInfo: React.FC<PlayerInfoProps> = ({ name, elo, color, position, userColor, winner, className }) => {
  const isRightSide = position === "right";

  return (
    <div
      className={clsx("flex items-center gap-3 lg:flex-row", {
        "flex-row-reverse": isRightSide,
        "flex-row": !isRightSide,
        [className || ""]: !!className,
      })}
    >
      <div
        className={clsx(
          "w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center lg:text-lg font-semibold shrink-0",
          {
            "bg-neutral-950 text-neutral-300": color === "black",
            "bg-neutral-50 text-neutral-950": color !== "black",
          },
        )}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className={clsx("flex-1 overflow-hidden", { "text-right lg:text-left": isRightSide })}>
        <div
          className={clsx("flex items-center gap-1 text-sm font-semibold text-neutral-100", {
            "flex-row-reverse": isRightSide,
          })}
        >
          <span
            className={clsx("truncate", {
              "text-green-400": winner === color,
            })}
          >
            {name}
          </span>
          {color && userColor === color && (
            <span
              className={clsx("shrink-0", {
                "text-green-400": winner === color,
                "text-neutral-400": winner !== color,
              })}
            >
              (you)
            </span>
          )}
          {winner === color && <Crown className="inline w-4 h-4 text-green-400 shrink-0" />}
          {winner === "draw" && <Handshake className="inline w-4 h-4 text-neutral-400 shrink-0" />}
        </div>
        <p className="text-xs text-neutral-400">{elo}</p>
      </div>
    </div>
  );
};

const createMoveQualityBadgeSvg = (quality: MoveQuality): string => {
  const colors = getMoveQualityColor(quality);
  const symbol = getMoveQualitySymbol(quality);

  const cx = 90;
  const cy = 10;
  const radius = 20;

  return `
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${colors.bg}" stroke="${colors.border}" stroke-width="2"/>
    <text 
      x="${cx}" 
      y="${cy + 6}" 
      text-anchor="middle" 
      font-size="20" 
      font-weight="bold" 
      fill="white"
      font-family="sans-serif"
    >${symbol}</text>
  `;
};

function playSound(san: string) {
  let sound = "move-self.mp3";

  if (san.includes("+") || san.includes("#")) {
    sound = "move-check.mp3";
  } else if (san.includes("x")) {
    sound = "capture.mp3";
  } else if (san.includes("O-O")) {
    sound = "castle.mp3";
  }

  const audio = new Audio(`/audio/${sound}`);
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  theme = "green",
  move,
  previousMove,
  className = "",
  arrows = [],
  orientation = "white",
  evaluation,
  players,
  userColor,
  winner,
  moveAnnotations = [],
  playable = false,
  onMove,
  legalDests,
  turnColor,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const onMoveRef = useRef(onMove);

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    if (!boardRef.current) {
      return;
    }

    const autoShapes: DrawShape[] = moveAnnotations.map((annotation) => ({
      orig: annotation.square,
      dest: annotation.square,
      customSvg: {
        html: createMoveQualityBadgeSvg(annotation.quality),
        center: "dest",
      },
    }));

    let movableConfig: Config["movable"] = {
      free: false,
      dests: new Map(),
    };

    if (playable) {
      movableConfig = {
        free: false,
        dests: legalDests,
        color: turnColor,
        showDests: true,
        events: {
          after: (orig: Key, dest: Key) => {
            console.log("ChessBoard: move completed", orig, dest);
            if (onMoveRef.current) {
              console.log("calling onMove callback");
              onMoveRef.current(orig, dest);
            }
          },
        },
      };
    }

    if (cgRef.current) {
      cgRef.current.set({
        turnColor,
        fen: move.fen,
        lastMove: previousMove,
        drawable: { shapes: arrows, autoShapes },
        orientation,
        movable: movableConfig,
        draggable: { enabled: playable },
        selectable: { enabled: playable },
      });
    } else {
      const config: Config = {
        turnColor,
        orientation,
        fen: move.fen,
        lastMove: previousMove,
        drawable: {
          enabled: true,
          visible: true,
          shapes: arrows,
          autoShapes,
        },
        movable: movableConfig,
        draggable: { enabled: playable },
        selectable: { enabled: playable },
        highlight: {
          lastMove: true,
          check: true,
        },
        animation: {
          enabled: true,
          duration: 200,
        },
        coordinates: true,
      };

      cgRef.current = Chessground(boardRef.current, config);
    }
  }, [move.fen, previousMove, arrows, orientation, moveAnnotations, legalDests, turnColor, playable]);

  useEffect(() => {
    return () => {
      cgRef.current?.destroy();
      cgRef.current = null;
    };
  }, []);

  // Play move sound when move changes
  useEffect(() => {
    playSound(move.san);
    if (cgRef.current) {
      const isCheck = move.san.includes("+") || move.san.includes("#");
      console.log("Setting check highlight to", isCheck);
      if (isCheck) {
        cgRef.current.set({ check: true });
      } else {
        cgRef.current.set({ check: false });
      }
    }
  }, [move.san]);

  const topPlayer = orientation === "white" ? players?.black : players?.white;
  const bottomPlayer = orientation === "white" ? players?.white : players?.black;
  const topColor = orientation === "white" ? "black" : "white";
  const bottomColor = orientation === "white" ? "white" : "black";

  return (
    <div className={`w-full mx-auto flex flex-col gap-3 ${className}`}>
      {players && (
        <div className="flex w-full justify-between lg:hidden">
          <BoardPlayerInfo
            name={orientation === "white" ? players.white.name : players.black.name}
            elo={orientation === "white" ? players.white.elo : players.black.elo}
            color={orientation === "white" ? "white" : "black"}
            position="left"
            userColor={userColor}
            winner={winner}
            className="w-[calc(50%-0.5rem)]"
          />
          <BoardPlayerInfo
            name={orientation === "white" ? players.black.name : players.white.name}
            elo={orientation === "white" ? players.black.elo : players.white.elo}
            color={orientation === "white" ? "black" : "white"}
            position="right"
            userColor={userColor}
            winner={winner}
            className="w-[calc(50%-0.5rem)]"
          />
        </div>
      )}

      {topPlayer && (
        <div className="hidden lg:block">
          <BoardPlayerInfo
            name={topPlayer.name}
            elo={topPlayer.elo}
            color={topColor}
            position="stacked"
            userColor={userColor}
            winner={winner}
          />
        </div>
      )}

      <div className={evaluation ? "grid grid-cols-[auto_1fr] gap-2" : "w-full"}>
        {evaluation && (
          <EvalBar
            evaluation={evaluation}
            orientation={orientation}
            className="rounded-md overflow-hidden border border-neutral-600/50"
          />
        )}

        <div
          id="hp-chessboard-wrapper"
          ref={boardRef}
          className={`cg-wrap cg-theme-${theme} aspect-square shadow-2xl`}
        />
      </div>

      {bottomPlayer && (
        <div className="hidden lg:block">
          <BoardPlayerInfo
            name={bottomPlayer.name}
            elo={bottomPlayer.elo}
            color={bottomColor}
            position="stacked"
            userColor={userColor}
            winner={winner}
          />
        </div>
      )}
    </div>
  );
};
