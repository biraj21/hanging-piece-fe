import { GITHUB_REPO_URL } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/router/routes";
import { BarChart3Icon, SwordsIcon } from "lucide-react";
import { Link } from "react-router";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Welcome Message */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome back
          </h1>
          <p className="text-neutral-400 text-sm">
            Hey{" "}
            <span className="text-white font-medium">
              {user?.name?.split(" ")[0] || user?.email?.split("@")[0]}
            </span>
            , ready to analyze some chess?
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to={ROUTES.GAMES}
            className="group bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-4 hover:border-neutral-600 transition-all hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <SwordsIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-0.5">
                  My Games
                </h3>
                <p className="text-xs text-neutral-400">
                  Browse and analyze your games
                </p>
              </div>
            </div>
          </Link>

          <Link
            to={ROUTES.ANALYSIS}
            className="group bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-4 hover:border-neutral-600 transition-all hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <BarChart3Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-0.5">
                  Analyze PGN
                </h3>
                <p className="text-xs text-neutral-400">
                  Import and analyze any game
                </p>
              </div>
            </div>
          </Link>
        </div>

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/15 hover:text-emerald-200"
        >
          <span aria-hidden="true">★</span>
          Enjoying Hanging Piece? Support the project with a GitHub star
        </a>
      </div>
    </div>
  );
}
