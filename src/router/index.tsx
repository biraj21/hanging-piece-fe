import { Route, Routes } from "react-router";

import { ProtectedRoutes, StrictlyPublicRoutes } from "@/components/route-protection";
import { DashboardLayout } from "@/layouts/dashboard";
import AnalysisPage from "@/pages/analysis";
import DashboardPage from "@/pages/dashboard";
import GamesPage from "@/pages/games";
import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";
import OnboardingPage from "@/pages/onboarding";
import ProfilePage from "@/pages/profile";

import { ROUTES } from "./routes";

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.INDEX} element={<IndexPage />} />

      <Route element={<StrictlyPublicRoutes redirectTo={ROUTES.DASHBOARD} />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoutes redirectTo={ROUTES.LOGIN} />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.GAMES} element={<GamesPage />} />
          <Route path={ROUTES.ANALYSIS} element={<AnalysisPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        </Route>
        <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
      </Route>

      {/* catch all */}
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
