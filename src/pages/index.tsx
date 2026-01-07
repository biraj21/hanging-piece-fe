import { ChessKnightIcon, Crown, Handshake, SearchIcon } from "lucide-react";
import { useNavigate } from "react-router";

import { MoveQualityIcon } from "@/components/analysis/MoveQualityIcon";
import { Loader } from "@/components/Loader";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/router/routes";

export default function IndexPage() {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen w-full bg-neutral-800 flex flex-col overflow-x-hidden">
      {/* Hero Section - Above the fold */}
      <section className="shrink-0 px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo + Badge */}
          <div className="mb-6 sm:mb-8 flex flex-col justify-center items-center">
            <Logo />
            <span className="mt-3 inline-block bg-white text-neutral-900 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
              Coming Soon
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            An AI chess coach that explains <span className="text-emerald-400">WHY</span> you blundered
          </h1>
        </div>
      </section>

      {/* Main Content - Below the fold */}
      <main className="flex-1 px-4 sm:px-6 pb-6 sm:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Demo Video */}
          <section className="mb-8 sm:mb-12">
            <div className="max-w-2xl mx-auto">
              <div className="aspect-video rounded-lg overflow-hidden bg-neutral-900 shadow-2xl">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/E8fj1dmj4a0?si=2ZDZsJAv7_-nOwMQ"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </section>

          {/* CTA Button */}
          <button
            onClick={() => (isAuthenticated ? navigate(ROUTES.DASHBOARD) : signIn(ROUTES.DASHBOARD))}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 border border-emerald-500/50 rounded-lg text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-emerald-700 active:bg-emerald-800 transition-all duration-200 mx-auto mb-6"
          >
            <ChessKnightIcon />
            {isAuthenticated ? "Go to Dashboard" : "Get Early Access"}
          </button>

          {/* Features Grid */}
          <section className="mb-8 sm:mb-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-neutral-900/60 border border-neutral-600/50 rounded-lg p-3 sm:p-4 text-center">
                <div className="flex justify-center mb-2">
                  <MoveQualityIcon moveQuality="blunder" size="medium" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">Blunder Analysis</h3>
                <p className="text-[10px] sm:text-xs text-neutral-400 leading-snug">
                  Understand WHY you lost that piece
                </p>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-600/50 rounded-lg p-3 sm:p-4 text-center">
                <div className="flex justify-center mb-2">
                  <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">Stockfish Analysis</h3>
                <p className="text-[10px] sm:text-xs text-neutral-400 leading-snug">
                  Powered by world-class chess engine
                </p>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-600/50 rounded-lg p-3 sm:p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Handshake className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">Chess.com & Lichess</h3>
                <p className="text-[10px] sm:text-xs text-neutral-400 leading-snug">Sync your games automatically</p>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-600/50 rounded-lg p-3 sm:p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">Learn & Improve</h3>
                <p className="text-[10px] sm:text-xs text-neutral-400 leading-snug">Stop repeating the same mistakes</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-neutral-700/50 px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <a
                href="https://www.linkedin.com/company/hanging-piece"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://x.com/hangingpiece"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Twitter
              </a>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500">
              © {new Date().getFullYear()} Hanging Piece. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
