import { DiscordIcon } from "@/components/icons/DiscordIcon";
import { Logo } from "@/components/Logo";
import { ROUTES } from "@/router/routes";
import { GlobeIcon, LinkedinIcon, TwitterIcon } from "lucide-react";
import { Link } from "react-router";

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-neutral-800 flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="shrink-0 px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">
        <div className="max-w-3xl mx-auto text-center">
          <Link to={ROUTES.INDEX}>
            <Logo />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 pb-6 sm:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Company Overview */}
          <section className="mb-12">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                About Hanging Piece
              </h1>

              {/* tl;dr FIRST */}
              <div className="mb-10">
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
                  Company Overview
                </h2>
                <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">
                  Hanging Piece is a consumer AI / edtech startup focused on
                  helping chess players improve by explaining the reasoning
                  behind their mistakes using Stockfish-backed analysis.
                </p>
              </div>

              {/* Product Status */}
              <div className="mb-10">
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
                  Product Status
                </h2>
                <div className="inline-flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/50 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-emerald-400 font-medium">
                    Public Beta
                  </span>
                </div>
                <p className="text-sm text-neutral-400 mt-2">
                  Under active development
                </p>
              </div>

              {/* Detailed Product Description */}
              <div className="pt-8 border-t border-neutral-700/50">
                <h2 className="text-xl sm:text-2xl font-semibold text-white text-center mb-6">
                  What Hanging Piece Does
                </h2>
                <p className="text-base sm:text-lg text-neutral-300 leading-relaxed mb-6">
                  Hanging Piece is an AI-powered chess coach that explains{" "}
                  <span className="text-emerald-400 font-medium">WHY</span> you
                  make mistakes. Most chess players plateau not because they
                  lack tactics, but because they never truly understand the
                  reasoning behind their blunders. We help chess enthusiasts
                  systematically improve by providing contextual, human-readable
                  explanations powered by world-class Stockfish analysis.
                </p>
                <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">
                  Whether you're a 1000 rated player struggling with opening
                  principles or a 1600 rated player trying to break through a
                  plateau, Hanging Piece gives you the insights you need to stop
                  repeating the same mistakes and start improving.
                </p>
              </div>
            </div>
          </section>

          {/* Key Features */}
          <section className="mb-12">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold text-white text-center mb-6">
                Key Features
              </h2>
              <div className="space-y-4">
                <div className="bg-neutral-900/60 border border-neutral-600/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">
                    Upload and analyze chess games
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Support for PGN files and integration with chess platforms
                  </p>
                </div>
                <div className="bg-neutral-900/60 border border-neutral-600/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">
                    AI-generated, human-readable explanations
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Understand the reasoning behind mistakes in plain language
                  </p>
                </div>
                <div className="bg-neutral-900/60 border border-neutral-600/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">
                    Engine-backed analysis powered by Stockfish
                  </h3>
                  <p className="text-sm text-neutral-400">
                    World-class engine evaluation for accuracy
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Product Demo */}
          <section className="mb-12">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold text-white text-center mb-6">
                Product Demo
              </h2>
              <p className="text-base text-neutral-300 text-center mb-6">
                Watch a short demo of Hanging Piece in action below.
              </p>
              <div className="aspect-video rounded-lg overflow-hidden bg-neutral-900 shadow-2xl">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/E8fj1dmj4a0?si=2ZDZsJAv7_-nOwMQ"
                  title="Hanging Piece Product Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </section>

          {/* Team */}
          <section className="mb-12">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-6">
                Team
              </h2>

              {/* Compliance line (non-visual) */}
              <p className="sr-only">
                Hanging Piece is an early-stage startup applying for Google
                Cloud Startup Credits.
              </p>

              <div className="bg-neutral-900/60 border border-neutral-600/50 rounded-lg p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Biraj Patel
                    </h3>
                    <p className="text-emerald-400 font-medium mb-3">
                      Founder & Developer
                    </p>
                    <p className="text-sm text-neutral-300 leading-relaxed mb-4">
                      Two time founding engineer. Previously worked on real-time
                      voice AI and RAG-based chatbots. Currently building
                      Hanging Piece to help chess players improve.
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                      <a
                        href="https://www.linkedin.com/in/biraj21/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
                      >
                        <LinkedinIcon className="w-4 h-4" />
                        LinkedIn
                      </a>
                      <a
                        href="https://x.com/biraj21_"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
                      >
                        <TwitterIcon className="w-4 h-4" />
                        Twitter
                      </a>
                      <a
                        href="https://biraj21.github.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
                      >
                        <GlobeIcon className="w-4 h-4" />
                        Website
                      </a>
                    </div>
                  </div>
                </div>

                <p className="text-center text-neutral-300 mt-6 font-medium">
                  Hanging Piece is built and operated by a{" "}
                  <span className="text-emerald-400">solo founder</span>.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Get in Touch
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 mb-6">
                Have questions, feedback, or just want to say hi? We'd love to
                hear from you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="mailto:biraj@hangingpiece.com"
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-700/50 border border-neutral-600/50 rounded-lg text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
                >
                  biraj@hangingpiece.com
                </a>
                <a
                  href="https://discord.gg/GuSBEdub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#5865F2]/90 border border-[#5865F2]/50 rounded-lg text-sm font-medium text-white hover:bg-[#5865F2] transition-colors"
                >
                  <DiscordIcon className="w-4 h-4" />
                  Join our Discord
                </a>
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
              <Link
                to={ROUTES.INDEX}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Home
              </Link>
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
