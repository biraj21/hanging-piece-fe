import type { User } from "@/contexts/AuthContext";

export function isOnboardingComplete(user: User) {
  return user.chesscomId || user.lichessId;
}
