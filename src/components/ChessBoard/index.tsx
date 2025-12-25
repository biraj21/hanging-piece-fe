import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { Key } from "@lichess-org/chessground/types";
import { useEffect, useRef } from "react";

import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.cburnett.css";

import "./style.css";

export type ChessBoardTheme = "dark-gray" | "green";

export interface ChessBoardProps {
  fen: string;
  lastMove?: [Key, Key];
  theme?: ChessBoardTheme;
  className?: string;
  arrows?: Array<{ orig: Key; dest: Key; brush?: string }>;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ theme = "green", fen, lastMove, className = "", arrows = [] }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

  // handle the board creation and updates
  useEffect(() => {
    if (!boardRef.current) {
      return;
    }

    if (cgRef.current) {
      cgRef.current.set({ fen, lastMove, drawable: { shapes: arrows } });
    } else {
      const defaultConfig: Config = {
        orientation: "white",
        fen,
        lastMove,
        drawable: {
          enabled: true,
          shapes: arrows,
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
  }, [fen, lastMove, arrows]);

  // destroy the board when the component unmounts
  useEffect(() => {
    return () => {
      cgRef.current?.destroy();
      cgRef.current = null;
    };
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={boardRef}
        className={`cg-wrap cg-theme-${theme} w-full aspect-square rounded-lg shadow-2xl overflow-hidden`}
      />
    </div>
  );
};

export default ChessBoard;
