import { Logo } from "@/components/Logo";
import { Tagline } from "@/components/Tagline";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/router/routes";
import { LogInIcon } from "lucide-react";
import { Link } from "react-router";

export default function LoginPage() {
  const { signIn, isLoading } = useAuth();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-800 flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center w-full max-w-md">
        {/* Logo/Brand */}
        <Logo className="mb-8" />

        {/* Welcome Message */}
        <div className="mb-8 space-y-2">
          <Tagline />
        </div>

        {/* Sign In Section */}
        <div className="space-y-6 mb-8">
          <button
            onClick={() => signIn()}
            disabled={isLoading}
            className="mx-auto flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-sm text-white transition-colors shadow-lg hover:shadow-xl"
          >
            <LogInIcon className="w-4 h-4" />
            {isLoading ? "Signing in..." : "Sign In with Google"}
          </button>
        </div>

        {/* Footer Links */}
        <div className="pt-6 border-t border-neutral-700/50">
          <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
            <Link
              to={ROUTES.PRIVACY}
              className="hover:text-emerald-400 transition-colors"
            >
              Privacy
            </Link>
            <span className="text-neutral-600">•</span>
            <Link
              to={ROUTES.TERMS}
              className="hover:text-emerald-400 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
