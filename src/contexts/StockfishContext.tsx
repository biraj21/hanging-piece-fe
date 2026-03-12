/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { Stockfish } from "@/helpers/stockfish";

type StockfishStatus = "idle" | "loading" | "ready" | "error";

interface StockfishContextType {
  engine: Stockfish | null;
  status: StockfishStatus;
  error: Error | null;
}

const StockfishContext = createContext<StockfishContextType | undefined>(undefined);

interface StockfishProviderProps {
  children: ReactNode;
}

export const StockfishProvider: React.FC<StockfishProviderProps> = ({ children }) => {
  const [engine, setEngine] = useState<Stockfish | null>(null);
  const [status, setStatus] = useState<StockfishStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const newEngine = Stockfish.create();
    setEngine(newEngine);
    setStatus("loading");
    setError(null);

    let cancelled = false;

    newEngine
      .ensureReady()
      .then(() => {
        if (cancelled) {
          return;
        }

        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        console.error("Failed to initialize Stockfish engine:", err);
        setError(err instanceof Error ? err : new Error("Failed to initialize Stockfish engine"));
        setStatus("error");
      });

    return () => {
      cancelled = true;

      newEngine.terminate();
      setEngine(null);
      setStatus("idle");
    };
  }, []);

  return <StockfishContext.Provider value={{ engine, status, error }}>{children}</StockfishContext.Provider>;
};

export function useStockfish() {
  const context = useContext(StockfishContext);
  if (context === undefined) {
    throw new Error("useStockfish must be used within a StockfishProvider");
  }

  return context;
}
