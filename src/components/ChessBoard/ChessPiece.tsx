import "@lichess-org/chessground/assets/chessground.cburnett.css";

import { useEffect, useRef } from "react";

interface ChessPieceProps {
  san: string;
  ply: number;
}

/**
 * Render a `@lichess-org/chessground`'s `<piece>` element for the move list.
 *
 * On dark tiles, black pieces are hard to see, so for *unselected* black moves
 * we reuse the white SVG plus an invert/brightness filter class to visually
 * approximate a "lightened black" piece without touching the board theme.
 */
export const ChessPiece: React.FC<ChessPieceProps> = ({ san, ply }) => {
  const cgWrapDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const firstChar = san.charAt(0);
    const color = ply % 2 === 1 ? "white" : "black"; // Odd ply = white, even ply = black

    let className: string;

    let colorClass = color;
    if (color === "black") {
      colorClass = "white move-item-white-piece-inverted-for-black";
    }

    if (san === "O-O" || san === "O-O-O") {
      // Handle castling
      className = `king ${colorClass}`;
    } else {
      // Handle piece moves
      switch (firstChar) {
        case "K":
          className = `king ${colorClass}`;
          break;
        case "Q":
          className = `queen ${colorClass}`;
          break;
        case "R":
          className = `rook ${colorClass}`;
          break;
        case "B":
          className = `bishop ${colorClass}`;
          break;
        case "N":
          className = `knight ${colorClass}`;
          break;
        default:
          className = `pawn ${colorClass}`; // Pawn moves don't have a piece letter
      }
    }

    if (cgWrapDivRef.current && !cgWrapDivRef.current.hasChildNodes()) {
      const pieceElement = document.createElement("piece");
      pieceElement.className = className;
      pieceElement.style.width = "100%";
      pieceElement.style.height = "100%";
      cgWrapDivRef.current.appendChild(pieceElement);
    }
  }, [san, ply]);

  return <div className="cg-wrap w-5 h-5" ref={cgWrapDivRef}></div>;
};
