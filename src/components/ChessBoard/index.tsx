import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { Key } from "@lichess-org/chessground/types";
import type { Evaluation } from "chessops/pgn";
import { useEffect, useRef } from "react";

import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.cburnett.css";

import { EvalBar } from "@/components/analysis/EvalBar";
import { getMoveQualityColor, getMoveQualitySymbol } from "@/helpers/move-quality";
import type { MoveQuality } from "@/helpers/pgn";
import type { BlackOrWhite } from "@/types";

import type { DrawShape } from "@lichess-org/chessground/draw";
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

export interface ChessBoardProps {
  fen: string;
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
  moveAnnotations?: MoveAnnotation[];
}

interface PlayerInfoProps {
  name: string;
  elo: string;
  color: BlackOrWhite;
}

const BoardPlayerInfo: React.FC<PlayerInfoProps> = ({ name, elo, color }) => {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <div
        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center lg:text-lg font-semibold ${
          color === "black" ? "bg-neutral-950 text-neutral-300" : "bg-neutral-50 text-neutral-950"
        }`}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-neutral-100">{name}</div>
        <div className="text-xs text-neutral-400">{elo}</div>
      </div>
    </div>
  );
};

const createMoveQualityBadgeSvg = (quality: MoveQuality): string => {
  const colors = getMoveQualityColor(quality);
  const symbol = getMoveQualitySymbol(quality);

  // Position badge in top-right corner of the 100x100 viewBox
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

export const ChessBoard: React.FC<ChessBoardProps> = ({
  theme = "green",
  fen,
  previousMove,
  className = "",
  arrows = [],
  orientation = "white",
  evaluation,
  players,
  moveAnnotations = [],
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

  // handle the board creation and updates
  useEffect(() => {
    if (!boardRef.current) {
      return;
    }

    // Convert move annotations to Chessground autoShapes with customSvg
    const autoShapes: DrawShape[] = moveAnnotations.map((annotation) => ({
      orig: annotation.square,
      dest: annotation.square,
      customSvg: {
        html: createMoveQualityBadgeSvg(annotation.quality),
        center: "dest",
      },
    }));

    if (cgRef.current) {
      cgRef.current.set({
        fen,
        lastMove: previousMove,
        drawable: { shapes: arrows, autoShapes },
        orientation,
      });
    } else {
      const defaultConfig: Config = {
        orientation,
        fen,
        lastMove: previousMove,
        drawable: {
          enabled: true,
          visible: true,
          shapes: arrows,
          autoShapes,
        },
        movable: {
          free: false,
          dests: new Map(),
        },
        highlight: {
          lastMove: true,
        },
        draggable: {
          enabled: false,
        },
        animation: {
          enabled: true,
          duration: 200,
        },
        coordinates: true,
      };

      cgRef.current = Chessground(boardRef.current, defaultConfig);
    }
  }, [fen, previousMove, arrows, orientation, moveAnnotations]);

  // destroy the board when the component unmounts
  useEffect(() => {
    return () => {
      cgRef.current?.destroy();
      cgRef.current = null;
    };
  }, []);

  // Determine which player goes on top based on orientation
  const topPlayer = orientation === "white" ? players?.black : players?.white;
  const bottomPlayer = orientation === "white" ? players?.white : players?.black;
  const topColor = orientation === "white" ? "black" : "white";
  const bottomColor = orientation === "white" ? "white" : "black";

  return (
    <div className={`w-full mx-auto flex flex-col gap-3 ${className}`}>
      {/* Top Player */}
      {topPlayer && <BoardPlayerInfo name={topPlayer.name} elo={topPlayer.elo} color={topColor} />}

      {/* Chessboard with optional Eval Bar */}
      <div className="flex gap-2 items-stretch">
        {evaluation && (
          <EvalBar
            evaluation={evaluation}
            orientation={orientation}
            className="h-full rounded-md overflow-hidden shadow-lg border border-neutral-600/50"
          />
        )}
        <div className="flex-1">
          <div
            id="hp-chessboard-wrapper"
            ref={boardRef}
            className={`cg-wrap cg-theme-${theme} w-full aspect-square rounded-lg shadow-2xl`}
          />
        </div>
      </div>

      {/* Bottom Player */}
      {bottomPlayer && <BoardPlayerInfo name={bottomPlayer.name} elo={bottomPlayer.elo} color={bottomColor} />}
    </div>
  );
};
