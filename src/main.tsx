import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import AppRouter from "@/router";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" theme="dark" richColors closeButton />
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
