import { Logo } from "@/components/Logo";
import { LogInIcon, XIcon } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-800 border border-neutral-600 rounded-2xl shadow-2xl max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-500 hover:text-white transition-colors p-1.5 hover:bg-neutral-700 rounded-lg"
        >
          <XIcon size={18} />
        </button>

        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <Logo />

          <h2 className="text-lg font-bold text-white mt-5">
            Sign in to continue
          </h2>

          <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
            Sign in to use AI Coach. I’m a <u>solo developer</u> covering the
            costs, so login helps keep this running.
          </p>

          <button
            onClick={onLogin}
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-sm text-white transition-colors"
          >
            <LogInIcon size={16} />
            Sign in with Google
          </button>

          <button
            onClick={onClose}
            className="mt-3 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
