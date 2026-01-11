import { Logo } from "@/components/Logo";
import { LogInIcon, SparklesIcon, XIcon } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-800 border border-neutral-600 rounded-xl shadow-2xl max-w-sm w-full">
        <div className="sticky top-0 bg-neutral-800 border-b border-neutral-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-bold text-white">Wanna sign up my friend?</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1 hover:bg-neutral-700 rounded"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="flex justify-center">
            <Logo />
          </div>

          <div className="flex items-start gap-3">
            <SparklesIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-neutral-200 leading-relaxed">
              Sign in to easily analyze more games from chess.com and Lichess.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-neutral-800 border-t border-neutral-600 px-6 py-4 rounded-b-xl space-y-3">
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-sm text-white transition-colors shadow-lg hover:shadow-xl"
          >
            <LogInIcon size={16} />
            Sign in with Google
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-neutral-400 hover:text-neutral-300 text-sm transition-colors"
          >
            Just show me the explanation man
          </button>
        </div>
      </div>
    </div>
  );
};
