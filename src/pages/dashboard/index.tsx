import { Link, useNavigate } from "react-router";

import { Logo } from "@/components/Logo";
import { Tagline } from "@/components/Tagline";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/router/routes";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.INDEX);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center w-full max-w-md">
        {/* Logo/Brand */}
        <Logo />

        {/* Welcome Message */}
        <div className="mt-4 mb-6">
          <div className="text-neutral-300 text-sm">
            Glad to have you on board, <span className="text-green-500">{user?.email}</span>.
          </div>
        </div>

        {/* Tagline */}
        <Tagline />

        {/* Status Badge */}
        <div className="mb-12 mt-8">
          <div className="inline-block bg-white text-neutral-900 px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-widest">
            Coming Soon
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to={ROUTES.INDEX} className="underline text-sm text-white">
            Home
          </Link>
          <button
            onClick={handleSignOut}
            className="underline text-sm text-red-400 bg-transparent p-0 border-none outline-none cursor-pointer"
            type="button"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
