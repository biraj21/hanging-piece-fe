import { Route, Routes } from "react-router";

import { ProtectedRoutes, StrictlyPublicRoutes } from "@/components/route-protection";
import AnalysisPage from "@/pages/analysis";
import DashboardPage from "@/pages/dashboard";
import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";

import { ROUTES } from "./routes";

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.INDEX} element={<IndexPage />} />

      <Route element={<StrictlyPublicRoutes redirectTo={ROUTES.DASHBOARD} />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoutes redirectTo={ROUTES.LOGIN} />}>
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.ANALYSIS} element={<AnalysisPage />} />
      </Route>

      {/* catch all */}
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
