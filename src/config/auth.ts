import { createAuthClient } from "better-auth/client";

import { env } from "@/config/env";

export const authClient = createAuthClient({
  baseURL: env.VITE_API_BASE_URL,
});

export async function signInWithGoogle(callbackURL?: string) {
  const data = await authClient.signIn.social({
    provider: "google",
    callbackURL: callbackURL || window.location.origin,
  });
  return data;
}

export async function signOut() {
  await authClient.signOut();
}
