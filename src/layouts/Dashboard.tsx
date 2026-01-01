import { Outlet } from "react-router";

import { Sidebar } from "@/components/Sidebar";

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen w-full bg-neutral-800 text-white">
      <Sidebar />
      <main className="ml-12 sm:ml-16 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
