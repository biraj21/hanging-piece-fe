import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/router/routes";

interface ProtectedRoutesProps {
  redirectTo: string;
}

/**
 * Routes wrapped in this component will only be accessible when the user is logged in.
 * Also checks if the user needs onboarding and redirects them if necessary.
 *
 * For example, if the user *isn't* logged in and they try to access the dashboard, then they will be
 * redirected to the page specified by the `redirectTo` prop.
 */
export const ProtectedRoutes: React.FC<ProtectedRoutesProps> = ({ redirectTo }) => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) {
    return <Navigate to={redirectTo} />;
  }

  // Check if user needs onboarding (neither chesscomId nor lichessId is set)
  const needsOnboarding = !user.chesscomId && !user.lichessId;
  if (needsOnboarding && pathname !== ROUTES.ONBOARDING) {
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }

  // If user has completed onboarding, redirect to dashboard
  if (!needsOnboarding && pathname === ROUTES.ONBOARDING) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

/**
 * Routes wrapped in this component will only be accessible when the user is NOT logged in.
 *
 * For example, if the user *is* logged in and they try to access the login page, they will be
 * redirected to the page specified by the `redirectTo` prop.
 */
export const StrictlyPublicRoutes: React.FC<ProtectedRoutesProps> = ({ redirectTo }) => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={redirectTo} />;
  }

  return <Outlet />;
};
