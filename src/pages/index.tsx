import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Tagline } from "@/components/Tagline";
import { Loader } from "@/components/Loader";

export default function IndexPage() {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const navigate = useNavigate();

  const indexFeatures = [
    "Lichess & Chess.com sync",
    "Stockfish analysis",
    "AI explains your blunders",
    "Compare with optimal lines",
  ];

  if (isLoading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center w-full max-w-md">
        {/* Logo/Brand */}
        <Logo />

        {/* Status Badge */}
        <div className="my-8">
          <div className="inline-block bg-white text-neutral-900 px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-widest">
            Coming Soon
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mb-12 space-y-3">
          {indexFeatures.map((feature, index) => (
            <p key={index} className="text-neutral-500 text-sm">
              <span className="text-neutral-300">→</span> {feature}
            </p>
          ))}
        </div>

        {/* Tagline */}
        <Tagline className="mb-6" />

        {/* Action Button */}
        <div>
          <button
            onClick={() => (isAuthenticated ? navigate("/dashboard") : signIn())}
            className="bg-white hover:bg-neutral-100 text-neutral-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto min-w-[160px]"
          >
            {isAuthenticated ? "Go to Dashboard" : "Join waitlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
