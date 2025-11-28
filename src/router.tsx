import { Route, Routes } from "react-router";

import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />

      {/* catch all */}
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
