import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const { signIn, isLoading } = useAuth();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center w-full max-w-md">
        {/* Logo/Brand */}
        <Logo className="mb-12" />

        {/* Sign In Section */}
        <div className="space-y-4">
          <button
            onClick={() => signIn()}
            disabled={isLoading}
            className="bg-white hover:bg-neutral-100 disabled:bg-neutral-300 disabled:cursor-not-allowed text-neutral-900 px-4 py-2 rounded-lg  text-sm font-medium transition-colors"
          >
            {isLoading ? "Signing in..." : "Sign In with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}
