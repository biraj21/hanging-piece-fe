import { Route, Routes } from "react-router";

import DashboardPage from "@/pages/dashboard";
import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";

import { ROUTES } from "./routes";

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.INDEX} element={<IndexPage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

      {/* catch all */}
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
