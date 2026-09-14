import { Loader } from "@/components/Loader";
import {
  authClient,
  signInWithGoogle as signInWithGoogleFn,
} from "@/config/auth";
import { isOnboardingComplete } from "@/helpers/onboarding";
import { ROUTES } from "@/router/routes";
import { usePostHog } from "posthog-js/react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  chesscomId?: string | null;
  lichessId?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (callbackPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const posthog = usePostHog();

  const checkSession = async (refresh = false) => {
    try {
      setIsLoading(true);
      const session = await authClient.getSession({
        ...(refresh && { query: { disableCookieCache: refresh } }),
      });
      if (session.error) {
        setUser(null);
        console.error("Session error:", session.error);
        toast.error(
          "Something went wrong while verifying your session. Please refresh the page & try again.",
        );
        return;
      }

      if (session.data?.user) {
        setUser(session.data.user as User);
      } else {
        setUser(null);
      }
    } catch (error) {
      toast.error(
        "Failed to verify session. Please refresh the page & try again.",
      );
      console.error("Session check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user) {
      // Identify sends an event, so you may want to limit how often you call it
      posthog.identify(user.id, {
        email: user.email,
      });
    }

    // Check if user needs onboarding (neither chesscomId nor lichessId is set)
    const needsOnboarding = !isOnboardingComplete(user);
    if (needsOnboarding && pathname !== ROUTES.ONBOARDING) {
      navigate(ROUTES.ONBOARDING, {
        replace: true,
        state: {
          redirectTo: pathname,
        },
      });
    } else if (!needsOnboarding && pathname === ROUTES.ONBOARDING) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [user, posthog, navigate, pathname]);

  if (isLoading) {
    return <Loader fullScreen />;
  }

  const signIn = async (callbackPath?: string) => {
    try {
      setIsLoading(true);
      await signInWithGoogleFn(callbackPath);
    } catch (error) {
      console.error("Sign in failed:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authClient.signOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    await checkSession(true);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
