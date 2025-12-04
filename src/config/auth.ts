import { createAuthClient } from "better-auth/client";

import { env } from "@/config/env";
import { ROUTES } from "@/router/routes";

export const authClient = createAuthClient({
  baseURL: env.VITE_API_BASE_URL,
  basePath: "/auth",
});

export async function signInWithGoogle(callbackPath?: string) {
  const callbackUrl = new URL(window.location.href);
  callbackUrl.pathname = callbackPath || ROUTES.INDEX;

  const data = await authClient.signIn.social({
    provider: "google",
    callbackURL: callbackUrl.toString(),
  });
  return data;
}

export async function signOut() {
  await authClient.signOut();
}
