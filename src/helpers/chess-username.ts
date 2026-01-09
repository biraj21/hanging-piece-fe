import type { User } from "@/contexts/AuthContext";

export function getChessAccountUsername(user: User, source: "chesscom" | "lichess" | (string & {})) {
  if (source === "chesscom") {
    return user.chesscomId?.toLowerCase() || "";
  } else if (source === "lichess") {
    return user.lichessId?.toLowerCase() || "";
  } else {
    return "";
  }
}
