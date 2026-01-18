import { useAuth } from "@/contexts/AuthContext";
import { DownloadIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent/BeforeInstallPromptEvent
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstaller: React.FC = () => {
  const { user } = useAuth();
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();

      // verify that the event is of type BeforeInstallPromptEvent
      // https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
      // https://web.dev/articles/customize-install
      if (!("prompt" in e)) {
        console.warn("beforeinstallprompt event missing prompt method");
        return;
      }

      const promptEvent = e as BeforeInstallPromptEvent;

      deferredPromptRef.current = promptEvent;
      setShowModal(true);
    };

    const handleAppInstalled = () => {
      setShowModal(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async () => {
    try {
      if (!deferredPromptRef.current) {
        return;
      }

      await deferredPromptRef.current.prompt();
      const userChoice = await deferredPromptRef.current.userChoice;
      console.log("PWA installation outcome:", userChoice);
    } catch (err) {
      console.error("PWA installation failed:", err);
    } finally {
      deferredPromptRef.current = null;
      setShowModal(false);
    }
  };

  const dismiss = () => {
    setShowModal(false);
  };

  if (!user || !showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4 sm:p-6  z-50">
      <div className="fixed inset-0 bg-black/60" onClick={dismiss} />

      <div className="relative bg-neutral-800 border border-neutral-600 rounded-2xl shadow-2xl max-w-sm w-full animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-neutral-500 hover:text-white transition-colors p-1.5 hover:bg-neutral-700 rounded-lg"
        >
          <XIcon size={18} />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-600/20 rounded-xl">
              <DownloadIcon className="w-6 h-6 text-emerald-500" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Install Hanging Piece</h3>
              <p className="text-sm text-neutral-400 mt-1">
                Add to home screen for the best experience. Access your games and analysis faster.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={dismiss}
              className="flex-1 px-4 py-2.5 bg-neutral-700 hover:bg-neutral-600 rounded-lg font-medium text-sm text-white transition-colors"
            >
              Not now
            </button>
            <button
              onClick={install}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium text-sm text-white transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
