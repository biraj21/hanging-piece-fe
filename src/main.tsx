import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import AppRouter from "@/router";
import { PostHogProvider } from "posthog-js/react";

import { env } from "./config/env";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 15, // 15 minutes
    },
  },
});

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2025-11-30",
} as const;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PostHogProvider apiKey={env.VITE_PUBLIC_POSTHOG_KEY} options={posthogOptions}>
        <BrowserRouter>
          <AuthProvider>
            <Toaster position="top-right" theme="dark" richColors closeButton />
            <AppRouter />
          </AuthProvider>
        </BrowserRouter>
      </PostHogProvider>
    </QueryClientProvider>
  </StrictMode>
);
